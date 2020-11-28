class EventSource{
	listen(listener){
		this.addListener(listener);
		return {
			cancel: () => {
				this.removeListener(listener)
			}
		};
	}
	when(predicate, cancellationToken){
		var resolve;
		var promise = new Promise((res) => {resolve = res;});
		var listener = this.listen(function(){
			if(predicate.apply(null, arguments)){
				listener.cancel();
				resolve();
			}
		});
		if(cancellationToken){
			cancellationToken.onCancelled(() => listener.cancel());
		}
		return promise;
	}
}
class Event extends EventSource{
	constructor(){
		super();
		this.listeners = [];
	}
	addListener(listener){
		this.listeners.push(listener);
	}
	removeListener(listener){
		var index = this.listeners.indexOf(listener);
		if(index > -1){
			this.listeners.splice(index, 1)
		}
	}
	dispatch(e){
		for(let listener of this.listeners){
			listener(e);
		}
	}
}
class CancellationToken extends Event{
	constructor(){
		super();
		this.cancelled = false;
	}
	dispatch(){
		if(this.cancelled){
			return;
		}
		this.cancelled = true;
		for(let listener of this.listeners){
			listener();
		}
		this.listeners = [];
	}
	onCancelled(listener){
		return this.listen(listener);
	}
	cancel(){
		this.dispatch();
	}
}
class TabsUpdated extends EventSource{
	addListener(listener){
		chrome.tabs.onUpdated.addListener(listener);
	}
	removeListener(listener){
		chrome.tabs.onUpdated.removeListener(listener);
	}
}
class TabRemoved extends EventSource{
	addListener(listener){
		chrome.tabs.onRemoved.addListener(listener);
	}
	removeListener(listener){
		chrome.tabs.onRemoved.removeListener(listener);
	}
}
class RuntimeMessages extends EventSource{
	addListener(listener){
		chrome.runtime.onMessage.addListener(listener);
	}
	removeListener(listener){
		chrome.runtime.onMessage.removeListener(listener);
	}
}
var tabsUpdated = new TabsUpdated();
var tabRemoved = new TabRemoved();
var runtimeMessages = new RuntimeMessages();

class Tab{
	constructor(tabId){
		this.tabId = tabId;
	}
	whenComplete(){
		return this.whenStatusEquals("complete");
	}
	whenLoading(cancellationToken){
		return this.whenStatusEquals("loading", cancellationToken);
	}
	whenRemoved(cancellationToken){
		return tabRemoved.when(tabId => tabId === this.tabId, cancellationToken);
	}
	whenStatusEquals(status, cancellationToken){
		var resolve, promise = new Promise((res) => {resolve = res;});
		chrome.tabs.get(this.tabId, (tab) => {
			if(tab.status === status){
				resolve();
			}else{
				tabsUpdated.when((tabId, changeInfo) => {return tabId === this.tabId && changeInfo.status === status;}, cancellationToken).then(resolve);
			}
		});
		return promise;
	}
	focus(){
		chrome.tabs.update(this.tabId, {active: true})
	}
	executeScript(details){
		var resolve, reject, promise = new Promise((res, rej) => {resolve = res; reject = rej;});
		chrome.tabs.executeScript(this.tabId, details, () => {
			var e = chrome.runtime.lastError;
			if(e !== undefined){
				reject(e.message);
			}else{
				resolve();
			}
		});
		return promise;
	}
	sendMessageAsync(msg){
		var resolve, promise = new Promise((res) => {resolve = res;});
		chrome.tabs.sendMessage(this.tabId, msg, resp => resolve(resp));
		return promise;
	}
	sendMessage(msg, callback){
		chrome.tabs.sendMessage(this.tabId, msg, callback);
	}
	sendMessageToDevtoolsSidebar(msg, callback){
		chrome.runtime.sendMessage(undefined, {destinationDevtoolsTabId: this.tabId, message: msg}, callback);
	}
	listenToDevtoolsSidebarMessages(listener){
		return runtimeMessages.listen((msg, sender, sendResponse) => {
			if(msg.devtoolsTabId !== this.tabId){
				return;
			}
			console.log(`message from devtools sidebar, sender = `, sender)
			return listener(msg, (resp) => {
				sendResponse(resp);
			});
		});
	}
	listenToMessages(listener){
		return runtimeMessages.listen((msg, sender, sendResponse) => {
			if(!sender.tab || sender.tab.id !== this.tabId){
				return;
			}
			return listener(msg, (resp) => {
				sendResponse(resp);
			});
		});
	}
}


function urlMatchesPattern(url, pattern){
	var regexPattern = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[\\S]*?');
	var regex = new RegExp(`^${regexPattern}$`);
	return !!url.match(regex);
}
var pageId = 0;
class RuleCollection{
	constructor(){
		this.latestRuleId = 0;
		this.records = [];
		this.ruleUpdated = new Event();
		this.ruleAdded = new Event();
		this.ruleDeleted = new Event();
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
	deleteRule(ruleId){
		var index = this.records.findIndex(r => r.ruleId === ruleId);
		if(index > -1){
			this.records.splice(index, 1);
			this.save();
			this.ruleDeleted.dispatch();
		}
	}
	saveNewRule(rule){
		var ruleId = ++this.latestRuleId;
		this.records.push({ruleId: ruleId, rule: rule});
		this.save();
		this.ruleAdded.dispatch();
		return ruleId;
	}
	updateRule(ruleId, rule){
		var record = this.getRecord(ruleId);
		if(!record){
			return;
		}
		record.rule = rule;
		this.save();
		this.ruleUpdated.dispatch();
	}
	getAll(){
		return this.records.slice();
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
		this.pageId = pageId++;
		this.cancellationToken = new CancellationToken();
		this.tabId = tabId;
		this.tab = new Tab(tabId);
		this.tab.whenComplete().then(() => {
			Promise.any([this.tab.whenLoading(this.cancellationToken), this.tab.whenRemoved(this.cancellationToken)]).then(() => this.disappear());
		});
		this.hasDisappeared = false;
		this.onDisappeared = new Event();
		this.tabMessageListener = this.tab.listenToMessages((msg, sendResponse) => this.onMessageFromTab(msg, sendResponse));
		this.tabDevtoolsSidebarMessagesListener = this.tab.listenToDevtoolsSidebarMessages((msg, sendResponse) => this.onMessageFromDevtoolsSidebar(msg, sendResponse));
	}
	onMessageFromTab(msg, sendResponse){

	}
	onMessageFromDevtoolsSidebar(msg, sendResponse){

	}
	focus(){
		this.tab.focus();
	}
	afterDisappeared(){

	}
	disappear(){
		if(this.hasDisappeared){
			return;
		}
		this.cancellationToken.cancel();
		this.tabMessageListener.cancel();
		this.tabDevtoolsSidebarMessagesListener.cancel();
		this.hasDisappeared = true;
		this.afterDisappeared();
		this.onDisappeared.dispatch();
	}
}
class RegularPage extends Page{
	constructor(tabId, url){
		super(tabId);
		this.url = url;
		this.currentContentScriptId = undefined;
		this.ruleUpdatedSubscription = rules.ruleUpdated.listen(() => this.setRules());
		this.ruleAddedSubscription = rules.ruleAdded.listen(() => this.setRules());
		this.ruleDeletedSubscription = rules.ruleDeleted.listen(() => this.setRules());
		this.currentlySelectedElementInDevtools = undefined;
		this.initialize();
	}
	onMessageFromTab(msg, sendResponse){
		if(msg.contentScriptLoaded){
			this.onContentScriptLoaded(msg.contentScriptId);
			var rulesForPage = rules.getRulesForUrl(this.url);
			sendResponse({currentRules: rulesForPage});
		}else if(msg.elementSelectedInDevtools){
			this.currentlySelectedElementInDevtools = msg.element;
			this.tab.sendMessageToDevtoolsSidebar({currentlySelectedElement: this.currentlySelectedElementInDevtools});
		}
	}
	onMessageFromDevtoolsSidebar(msg, sendResponse){
		if(msg.devtoolsSidebarOpened){
			var rulesForPage = rules.getRulesForUrl(this.url);
			this.tab.sendMessage({contentScriptId: this.currentContentScriptId, requestEffects: true}, effects => {
				sendResponse({currentlySelectedElement: this.currentlySelectedElementInDevtools, currentRules: rulesForPage, effects: effects});
			});
			return true;
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
		return this.tab.sendMessageAsync({executeAction: true, contentScriptId: this.currentContentScriptId, action: action});
	}
	async executeRule(rule){
		for(var action of rule.actions){
			await this.executeAction(action);
		}
	}
	findSelectors(req, sendResponse){
		this.tab.sendMessage({findSelectors: true, contentScriptId: this.currentContentScriptId, req:req}, (resp) => {
			sendResponse(resp);
		});
	}
	onContentScriptLoaded(contentScriptId){
		if(this.currentContentScriptId !== undefined){
			console.log(`page ${this.url} has loaded another content script: ${contentScriptId}`);
		}
		this.currentContentScriptId = contentScriptId;
		console.log(`page ${this.url} (pageId ${this.pageId}) has loaded content script: ${contentScriptId}`);
	}
	async initialize(){
		try{
			await this.tab.executeScript({file: 'content-script.js', runAt: 'document_start'});
			chrome.browserAction.setPopup({
				tabId: this.tabId,
				popup:"popup.html"
			});
			this.setRules();
		}catch(e){
			console.log(`Skipping page: `, e)
			chrome.browserAction.disable(this.tabId);
			this.disappear();
		}
	}
	setRules(){
		var rulesForPage = rules.getRulesForUrl(this.url);
		chrome.browserAction.setBadgeText({tabId: this.tabId, text: `${(rulesForPage.length ? rulesForPage.length : '')}`});
		chrome.browserAction.setBadgeBackgroundColor({tabId: this.tabId, color: '#0a0'});
		console.log(`sending message to tab about current rules`)
		this.tab.sendMessage({contentScriptId: this.currentContentScriptId, currentRules: rulesForPage});
	}
	afterDisappeared(){
		this.ruleUpdatedSubscription.cancel();
		this.ruleAddedSubscription.cancel();
		this.ruleDeletedSubscription.cancel();
		if(this.currentContentScriptId === undefined){
			return;
		}
		this.tab.sendMessage({stopContentScript: true, contentScriptId: this.currentContentScriptId});
	}
}
class PageCollection{
	constructor(){
		this.pages = [];
		chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
			if(changeInfo.status === "loading"){
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
class RuleEditor extends Page{
	constructor(page, tabId, ruleId){
		super(tabId);
		this.ruleEditorId = ruleEditorId++;
		this.page = page;
		if(this.page){
			this.page.onDisappeared.addListener(() => this.onPageDestroyed())
		}
		this.ruleCreated = new Event();
		this.ruleId = ruleId;
		this.initialize();
	}
	onPageDestroyed(){
		this.page = undefined;
		this.tab.sendMessage({pageDestroyed: true});
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
	async initialize(){
		await this.tab.whenComplete();
		var rule = undefined;
		if(this.ruleId !== undefined){
			rule = rules.getRule(this.ruleId);
		}
		this.tab.sendMessage({initialize: true, url: this.page && this.page.url, ruleId: this.ruleId, rule: rule});
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
		this.editorOpened = new Event();
		this.editorClosed = new Event();
		this.newRuleCreated = new Event();
	}
	removeEditorFromList(list, editor){
		var index = list.indexOf(editor);
		if(index === -1){
			return false;
		}
		list.splice(index, 1);
		return true;
	}
	removeRuleEditor(editor){
		console.log(`removing editor`)
		if(this.removeEditorFromList(this.newRuleEditors, editor) || this.removeEditorFromList(this.existingRuleEditors, editor)){
			this.editorClosed.dispatch();
		}
	}
	getNonEditableRuleIds(pageId){
		return this.existingRuleEditors.filter(e => !!e.page && e.page.pageId !== pageId).map(e => e.ruleId);
	}
	getNonDeletableRuleIds(){
		return this.existingRuleEditors.map(e => e.ruleId);
	}
	editRule(ruleId){
		var existing = this.existingRuleEditors.find(e => e.ruleId === ruleId);
		if(existing){
			existing.focus();
		}else{
			RuleEditor.create(undefined, ruleId, editor => {
				editor.onDisappeared.addListener(() => {
					this.removeRuleEditor(editor);
				});
				this.existingRuleEditors.push(editor);
				this.editorOpened.dispatch();
			});
		}
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
				this.editorOpened.dispatch();
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
					this.newRuleCreated.dispatch();
				});
				this.newRuleEditors.push(editor);
				this.editorOpened.dispatch();
			});
		}
	}
}
var ruleEditors = new RuleEditorCollection();

class ManagementPage extends Page{
	constructor(tabId){
		super(tabId);
		this.onEditorOpenedSubscription = ruleEditors.editorOpened.listen(() => this.notifyOfDeletableIds());
		this.onEditorClosedSubscription = ruleEditors.editorClosed.listen(() => this.notifyOfDeletableIds());
		this.onNewRuleCreatedSubscription = ruleEditors.newRuleCreated.listen(() => this.notifyOfChangedRules());
		this.onRuleUpdatedSubscription = rules.ruleUpdated.listen(() => this.notifyOfChangedRules());
		this.initialize();
	}
	notifyOfDeletableIds(){
		var nonDeletable = ruleEditors.getNonDeletableRuleIds();
		this.tab.sendMessage({deletableRulesChange: true, nonDeletable: nonDeletable});
	}
	notifyOfChangedRules(){
		this.tab.sendMessage({rulesChanged: true, rules: this.getRules()});
	}
	onMessageFromTab(msg, sendResponse){
		if(msg.deleteRule){
			rules.deleteRule(msg.ruleId);
			sendResponse({});
		}else if(msg.editRule){
			ruleEditors.editRule(msg.ruleId);
		}
	}
	getRules(){
		var allRules = rules.getAll();
		var nonDeletable = ruleEditors.getNonDeletableRuleIds();
		return allRules.map(r => ({
				ruleId: r.ruleId,
				rule: r.rule,
				deletable: !nonDeletable.some(id => id === r.ruleId)
			}));
	}
	async initialize(){
		await this.tab.whenComplete();
		this.tab.sendMessage({
			initialize: true,
			rules: this.getRules()
		});
	}
	afterDisappeared(){
		this.onEditorOpenedSubscription.cancel();
		this.onEditorClosedSubscription.cancel();
		this.onNewRuleCreatedSubscription.cancel();
		this.onRuleUpdatedSubscription.cancel();
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
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
	if(sender.tab){
		return;
	}
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
		page.executeRule(rule).then(() => sendResponse({}));
		return true;
	}else if(msg.goToManagementPage){
		ManagementPage.open();
	}
});