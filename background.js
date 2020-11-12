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
function listenToMessageFromTab(tabId, listener){
	var messageListener = (msg, sender, sendResponse) => {
		if(!sender.tab || sender.tab.id !== tabId){
			return;
		}
		listener(msg, sendResponse);
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
	}
	saveNewRule(rule){
		console.log(`saving new rule`, rule)
		var ruleId = ++this.latestRuleId;
		this.records.push({ruleId: ruleId, rule: rule});
		return ruleId;
	}
	updateRule(ruleId, rule){
		var record = this.getRecord(ruleId);
		if(!record){
			return;
		}
		console.log(`updating rule ${ruleId}`, rule)
		record.rule = rule;
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
	constructor(tabId, url){
		this.pageId = pageId++;
		this.tabId = tabId;
		this.url = url;
		this.currentContentScriptId = undefined;
		this.onDestroyed = new Event();
		this.listener = listenToMessageFromTab(tabId, (msg, sendResponse) => {
			if(msg.contentScriptLoaded){
				this.onContentScriptLoaded(msg.contentScriptId);
			}
		});
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
	focus(){
		chrome.tabs.update(this.tabId, {active: true})
	}
	findClass(req){
		console.log(`going to find class for`, req)
		chrome.tabs.sendMessage(this.tabId, {findClass: true, contentScriptId: this.currentContentScriptId, req:req})
	}
	onContentScriptLoaded(contentScriptId){
		if(this.currentContentScriptId !== undefined){
			console.log(`page ${this.url} has loaded another content script: ${contentScriptId}`);
		}
		this.currentContentScriptId = contentScriptId;
		console.log(`page ${this.url} has loaded content script: ${contentScriptId}`);
	}
	async initialize(){
		await executeScript(this.tabId, 'content-script.js');
		chrome.browserAction.setPopup({
			tabId: this.tabId,
			popup:"dropdown.html"
		});
	}
	destroy(){
		this.listener.cancel();
		if(this.currentContentScriptId === undefined){
			return;
		}
		chrome.tabs.sendMessage(this.tabId, {stopContentScript: true, contentScriptId: this.currentContentScriptId});
		this.onDestroyed.dispatch();
	}
}
class PageCollection{
	constructor(){
		this.pages = [];
		chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
			if(changeInfo.status === "loading"){
				this.removePage(tabId);
			}else if(changeInfo.status === "complete"){
				this.addPage(tab);
			}
		});
		chrome.tabs.onRemoved.addListener((tabId) => {
			this.removePage(tabId);
		});
	}
	async addPage(tab){
		var page = new Page(tab.id, tab.url);
		this.pages.push(page);
		try{
			await page.initialize();
			console.log(`added page. current number of pages: ${this.pages.length}`)
		}catch(e){
			console.log(`Skipping page: `, e)
			this.removePage(tab.id);
			chrome.browserAction.disable(tab.id);
		}
	}
	getPageByTabId(tabId){
		return this.pages.find(p => p.tabId === tabId);
	}
	getPageById(pageId){
		return this.pages.find(p => p.pageId === pageId);
	}
	removePage(tabId){
		var index = this.pages.findIndex(p => p.tabId === tabId);
		if(index === -1){
			return;
		}
		var page = this.pages[index];
		page.destroy();
		this.pages.splice(index, 1);
		console.log(`removed page. current number of pages: ${this.pages.length}`)
	}
}
var pages = new PageCollection();
var ruleEditorId = 0;
class RuleEditor{
	constructor(page, tabId, ruleId){
		this.ruleEditorId = ruleEditorId++;
		this.page = page;
		page.onDestroyed.addListener(() => this.onPageDestroyed())
		this.tabId = tabId;
		this.initialized = false;
		this.editorPageExists = true;
		this.editorPageGone = new Event();
		this.ruleCreated = new Event();
		this.ruleId = ruleId;
		this.tabStartLoadingListener = onTabStartsLoading(tabId, () => {
			if(this.initialized){
				this.dispatchEditorPageGone();
			}
		});
		this.tabRemovedListener = onTabRemoved(tabId, () => this.dispatchEditorPageGone());
		this.tabMessageListener = listenToMessageFromTab(tabId, (msg, sendResponse) => this.onMessageFromTab(msg, sendResponse));
		this.initialize();
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
		}else if(msg.findClass){
			this.page.findClass(msg.req);
		}
	}
	dispatchEditorPageGone(){
		if(this.editorPageExists){
			this.editorPageExists = false;
			this.editorPageGone.dispatch();
		}
	}
	async initialize(){
		await tabComplete(this.tabId);
		var rule = undefined;
		if(this.ruleId !== undefined){
			rule = rules.getRule(this.ruleId);
		}
		chrome.tabs.sendMessage(this.tabId, {initialize: true, url: this.page.url, ruleId: this.ruleId, rule: rule});
		this.initialized = true;
	}
	focus(){
		chrome.tabs.update(this.tabId, {active: true})
	}
	destroy(){
		this.tabStartLoadingListener.cancel();
		this.tabRemovedListener.cancel();
		this.tabMessageListener.cancel();
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
		editor.destroy();
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
			chrome.tabs.create({url: 'create-rule.html'}, (tab) => {
				var editor = new RuleEditor(page, tab.id, ruleId);
				editor.editorPageGone.addListener(() => {
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
			chrome.tabs.create({url: 'create-rule.html'}, (tab) => {
				var editor = new RuleEditor(page, tab.id);
				editor.editorPageGone.addListener(() => {
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
	}
});