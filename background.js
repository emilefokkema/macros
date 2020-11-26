function executeScript(tabId, file){
	var resolve, reject, promise = new Promise((res, rej) => {resolve = res; reject = rej;});
	chrome.tabs.executeScript(tabId, {file: file}, () => {
		var e = chrome.runtime.lastError;
		if(e !== undefined){
			reject(e.message);
		}else{
			resolve();
		}
	});
	return promise;
}
function sendTabMessageAsync(tabId, msg){
	var resolve, promise = new Promise((res) => {resolve = res;});
	chrome.tabs.sendMessage(tabId, msg, resp => resolve(resp));
	return promise;
}
function listenToMessageFromTab(tabId, listener){
	var messageListener = (msg, sender, sendResponse) => {
		if(!sender.tab || sender.tab.id !== tabId){
			return;
		}
		var result = listener(msg, (resp) => {
			sendResponse(resp);
		});
		return result;
	};
	chrome.runtime.onMessage.addListener(messageListener);
	return {
		cancel(){
			chrome.runtime.onMessage.removeListener(messageListener);
		}
	}
}
function onTabStartsLoading(tabId, listener){
	var updatedListener = (_tabId, changeInfo, tab) => {
		if(_tabId === tabId && changeInfo.status === "loading"){
			listener();
		}
	};
	chrome.tabs.onUpdated.addListener(updatedListener);
	return {
		cancel(){
			chrome.tabs.onUpdated.removeListener(updatedListener);
		}
	};
}
function onTabRemoved(tabId, listener){
	var removedListener = (_tabId) => {
		if(_tabId === tabId){
			listener();
		}
	};
	chrome.tabs.onRemoved.addListener(removedListener);
	return {
		cancel(){
			chrome.tabs.onRemoved.removeListener(removedListener);
		}
	};
}
function tabComplete(tabId){
	var resolve, promise = new Promise((res) => {resolve = res;});
	var listener = (_tabId, changeInfo, tab) => {
		if(_tabId === tabId && changeInfo.status === "complete"){
			chrome.tabs.onUpdated.removeListener(listener);
			resolve();
		}
	};
	chrome.tabs.onUpdated.addListener(listener);
	return promise;
}
function urlMatchesPattern(url, pattern){
	var regexPattern = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[\\S]*?');
	var regex = new RegExp(`^${regexPattern}$`);
	return !!url.match(regex);
}
var pageId = 0;
class Event{
	constructor(){
		this.listeners = [];
	}
	addListener(listener){
		this.listeners.push(listener);
	}
	dispatch(e){
		for(let listener of this.listeners){
			listener(e);
		}
	}
}
class RuleCollection{
	constructor(){
		this.latestRuleId = 0;
		this.records = [];
		this.load();
	}
	load(){
		var item = localStorage.getItem('rules');
		var parsed = JSON.parse(item);
		if(!Array.isArray(parsed)){
			return;
		}
		for(var rule of parsed){
			this.saveNewRule(rule);
		}
		console.log(`loaded ${this.records.length} rules`)
	}
	save(){
		var rules = this.records.map(r => r.rule);
		localStorage.setItem('rules', JSON.stringify(rules));
	}
	saveNewRule(rule){
		var ruleId = ++this.latestRuleId;
		this.records.push({ruleId: ruleId, rule: rule});
		this.save();
		return ruleId;
	}
	updateRule(ruleId, rule){
		var record = this.getRecord(ruleId);
		if(!record){
			return;
		}
		record.rule = rule;
		this.save();
	}
	getRecord(ruleId){
		return this.records.find(r => r.ruleId === ruleId);
	}
	getRulesForUrl(url){
		return this.records.filter(r => urlMatchesPattern(url, r.rule.urlPattern));
	}
	getRule(ruleId){
		var record = this.getRecord(ruleId);
		if(record){
			return record.rule;
		}
	}
}
var rules = new RuleCollection();
class Page{
	constructor(tabId){
		this.tabId = tabId;
		this.initialized = true;
		this.hasDisappeared = false;
		this.onDisappeared = new Event();
		this.tabStartLoadingListener = onTabStartsLoading(tabId, () => {
			if(this.initialized){
				this.disappear();
			}
		});
		this.tabRemovedListener = onTabRemoved(tabId, () => this.disappear());
		this.tabMessageListener = listenToMessageFromTab(tabId, (msg, sendResponse) => this.onMessageFromTab(msg, sendResponse));
	}
	onMessageFromTab(msg, sendResponse){

	}
	focus(){
		chrome.tabs.update(this.tabId, {active: true})
	}
	afterDisappeared(){

	}
	disappear(){
		if(this.hasDisappeared){
			return;
		}
		this.tabStartLoadingListener.cancel();
		this.tabRemovedListener.cancel();
		this.tabMessageListener.cancel();
		this.hasDisappeared = true;
		this.afterDisappeared();
		this.onDisappeared.dispatch();
	}
}
class NewPage extends Page{
	constructor(tabId){
		super(tabId);
		this.initialized = false;
		this.initialize();
	}
	async initialize(){
		await tabComplete(this.tabId);
		this.initialized = true;
		this.afterInitialize();
	}
	afterInitialize(){

	}
}
class RegularPage extends Page{
	constructor(tabId, url){
		super(tabId);
		this.pageId = pageId++;
		this.url = url;
		this.currentContentScriptId = undefined;
		this.initialize();
	}
	onMessageFromTab(msg, sendResponse){
		if(msg.contentScriptLoaded){
			this.onContentScriptLoaded(msg.contentScriptId);
		}
	}
	getPopupInfo(nonEditableRuleIds){
		var rulesForPage = rules.getRulesForUrl(this.url);
		rulesForPage = rulesForPage.map(r => ({
			ruleId: r.ruleId,
			rule: r.rule,
			editable: !nonEditableRuleIds.some(id => id === r.ruleId)
		}))
		return {url: this.url, pageId: this.pageId, rules: rulesForPage}
	}
	executeAction(action){
		return sendTabMessageAsync(this.tabId, {executeAction: true, contentScriptId: this.currentContentScriptId, action: action});
	}
	async executeRule(rule){
		for(var action of rule.actions){
			await this.executeAction(action);
		}
	}
	findSelectors(req, sendResponse){
		chrome.tabs.sendMessage(this.tabId, {findSelectors: true, contentScriptId: this.currentContentScriptId, req:req}, (resp) => {
			sendResponse(resp);
		});
	}
	onContentScriptLoaded(contentScriptId){
		if(this.currentContentScriptId !== undefined){
			console.log(`page ${this.url} has loaded another content script: ${contentScriptId}`);
		}
		this.currentContentScriptId = contentScriptId;
		console.log(`page ${this.url} has loaded content script: ${contentScriptId}`);
	}
	async initialize(){
		try{
			await executeScript(this.tabId, 'content-script.js');
			chrome.browserAction.setPopup({
				tabId: this.tabId,
				popup:"popup.html"
			});
		}catch(e){
			console.log(`Skipping page: `, e)
			chrome.browserAction.disable(this.tabId);
			this.disappear();
		}
	}
	afterDisappeared(){
		if(this.currentContentScriptId === undefined){
			return;
		}
		chrome.tabs.sendMessage(this.tabId, {stopContentScript: true, contentScriptId: this.currentContentScriptId});
	}
}
class PageCollection{
	constructor(){
		this.pages = [];
		chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
			if(changeInfo.status === "complete"){
				this.addPage(tab);
			}
		});
	}
	async addPage(tab){
		var page = new RegularPage(tab.id, tab.url);
		this.pages.push(page);
		console.log(`added page. current number of pages: ${this.pages.length}`)
		page.onDisappeared.addListener(() => this.removePage(page));
	}
	getPageByTabId(tabId){
		return this.pages.find(p => p.tabId === tabId);
	}
	getPageById(pageId){
		return this.pages.find(p => p.pageId === pageId);
	}
	removePage(page){
		var index = this.pages.indexOf(page);
		if(index === -1){
			return;
		}
		this.pages.splice(index, 1);
		console.log(`removed page. current number of pages: ${this.pages.length}`)
	}
}
var pages = new PageCollection();
var ruleEditorId = 0;
class RuleEditor extends NewPage{
	constructor(page, tabId, ruleId){
		super(tabId);
		this.ruleEditorId = ruleEditorId++;
		this.page = page;
		page.onDisappeared.addListener(() => this.onPageDestroyed())
		this.ruleCreated = new Event();
		this.ruleId = ruleId;
	}
	onPageDestroyed(){
		this.page = undefined;
		chrome.tabs.sendMessage(this.tabId, {pageDestroyed: true});
	}
	onMessageFromTab(msg, sendResponse){
		if(msg.focusPage){
			this.page.focus();
		}else if(msg.createdRule){
			var ruleId = rules.saveNewRule(msg.createdRule);
			this.ruleId = ruleId;
			this.ruleCreated.dispatch();
			sendResponse({ruleId: ruleId});
		}else if(msg.updatedRule){
			rules.updateRule(this.ruleId, msg.updatedRule);
			sendResponse({});
		}else if(msg.findSelectors){
			this.page.findSelectors(msg.req, (resp) => {
				sendResponse(resp)
			});
			return true;
		}else if(msg.executeAction){
			this.page.executeAction(msg.action).then(resp => sendResponse(resp));
			return true;
		}
	}
	afterInitialize(){
		var rule = undefined;
		if(this.ruleId !== undefined){
			rule = rules.getRule(this.ruleId);
		}
		chrome.tabs.sendMessage(this.tabId, {initialize: true, url: this.page.url, ruleId: this.ruleId, rule: rule});
	}
	static create(page, ruleId, callback){
		chrome.tabs.create({url: 'create-rule.html'}, (tab) => {
			var editor = new RuleEditor(page, tab.id, ruleId);
			callback(editor);
		});
	}
}
class RuleEditorCollection{
	constructor(){
		this.newRuleEditors = [];
		this.existingRuleEditors = [];
	}
	removeEditorFromList(list, editor){
		var index = list.indexOf(editor);
		if(index === -1){
			return;
		}
		list.splice(index, 1);
	}
	removeRuleEditor(editor){
		console.log(`removing editor`)
		this.removeEditorFromList(this.newRuleEditors, editor);
		this.removeEditorFromList(this.existingRuleEditors, editor);
	}
	getNonEditableRuleIds(pageId){
		return this.existingRuleEditors.filter(e => !!e.page && e.page.pageId !== pageId).map(e => e.ruleId);
	}
	editRuleForPage(pageId, ruleId){
		var existing = this.existingRuleEditors.find(e => e.ruleId === ruleId);
		if(existing){
			existing.focus();
		}else{
			var page = pages.getPageById(pageId);
			RuleEditor.create(page, ruleId, editor => {
				editor.onDisappeared.addListener(() => {
					this.removeRuleEditor(editor);
				});
				this.existingRuleEditors.push(editor);
			});
		}
	}
	createRuleForPage(pageId){
		var existing = this.newRuleEditors.find(e => e.page.pageId === pageId);
		if(existing){
			existing.focus();
		}else{
			var page = pages.getPageById(pageId);
			RuleEditor.create(page, undefined, editor => {
				editor.onDisappeared.addListener(() => {
					this.removeRuleEditor(editor);
				});
				editor.ruleCreated.addListener(() => {
					console.log(`editor created new rule`)
					this.removeEditorFromList(this.newRuleEditors, editor);
					this.existingRuleEditors.push(editor);
				});
				this.newRuleEditors.push(editor);
			});
		}
	}
}
var ruleEditors = new RuleEditorCollection();

class ManagementPage extends NewPage{
	afterInitialize(){
		console.log(`management page loaded`);
	}
	static open(){
		if(this.instance){
			this.instance.focus();
		}else{
			chrome.tabs.create({url: 'management.html'}, (tab) => {
				this.instance = new ManagementPage(tab.id);
				this.instance.onDisappeared.addListener(() => {
					this.instance = undefined;
					console.log(`management page gone`)
				});
			});
		}
	}
}
chrome.tabs.query({}, async (tabs) => {
	await Promise.all(tabs.map(t => pages.addPage(t)));
	console.log(`pages: `, pages)
});
chrome.runtime.onMessage.addListener((msg, sender) => {
	if(msg.popupOpened){
		chrome.tabs.query({lastFocusedWindow: true, active: true}, tabs => {
			if(tabs.length !== 1){
				return;
			}
			var tab = tabs[0];
			var page = pages.getPageByTabId(tab.id);
			var nonEditableRuleIds = ruleEditors.getNonEditableRuleIds(page.pageId);
			var info = page.getPopupInfo(nonEditableRuleIds);
			chrome.runtime.sendMessage(undefined, {popupInfo: info})
		});
	}else if(msg.createRuleForPage){
		ruleEditors.createRuleForPage(msg.pageId);
	}else if(msg.editRule){
		ruleEditors.editRuleForPage(msg.pageId, msg.ruleId);
	}else if(msg.executeRule){
		var rule = rules.getRule(msg.ruleId);
		var page = pages.getPageById(msg.pageId);
		page.executeRule(rule);
	}else if(msg.goToManagementPage){
		ManagementPage.open();
	}
});