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
	constructor(){}
	saveNewRule(rule){
		console.log(`saving new rule`, rule)
		return rule;
	}
	editRuleOnTab(tabId, rule){
		var listen = listenToMessageFromTab(tabId, (msg, sendResponse) => {
			if(msg.createdRule){
				sendResponse({ruleSaved: true, rule: rule})
			}
		});
	}
}
var rules = new RuleCollection();
class Page{
	constructor(tabId, url, addTabMessageListener){
		this.pageId = pageId++;
		this.tabId = tabId;
		this.url = url;
		this.currentContentScriptId = undefined;
		this.onDestroyed = new Event();
		addTabMessageListener((msg) => {
			if(msg.contentScriptLoaded){
				this.onContentScriptLoaded(msg.contentScriptId);
			}
		});
	}
	getPopupInfo(){
		return {url: this.url, pageId: this.pageId}
	}
	focus(){
		chrome.tabs.update(this.tabId, {active: true})
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
		this.tabMessageListeners = [];
		this.activePage = undefined;
		chrome.runtime.onMessage.addListener((msg, sender) => {
			if(!sender.tab){
				return;
			}
			for(let listener of this.tabMessageListeners){
				listener.handle(sender.tab.id, msg);
			}
		});
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
	addTabMessageListener(tabId, listener){
		this.tabMessageListeners.push({
			tabId: tabId,
			handle(_tabId, msg){
				if(_tabId !== tabId){
					return;
				}
				listener(msg);
			}
		});
	}
	async addPage(tab){
		var page = new Page(tab.id, tab.url, (listener) => this.addTabMessageListener(tab.id, listener));
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
	focusPage(pageId){
		var page = this.getPageById(pageId);
		if(!page){
			return;
		}
		page.focus();
	}
	getPageByTabId(tabId){
		return this.pages.find(p => p.tabId === tabId);
	}
	getPageById(pageId){
		return this.pages.find(p => p.pageId === pageId);
	}
	removeTabMessageListener(tabId){
		var index = this.tabMessageListeners.findIndex(l => l.tabId === tabId);
		if(index > -1){
			this.tabMessageListeners.splice(index, 1);
		}
	}
	removePage(tabId){
		this.removeTabMessageListener(tabId);
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
class PageRuleCreator{
	constructor(){
		this.editors = [];
		chrome.tabs.onRemoved.addListener((tabId) => {
			this.removeEditor(tabId);
		});
		chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
			var editor = this.editors.find(e => e.tabId === tabId);
			if(!editor){
				return;
			}
			if(changeInfo.status === "complete"){
				this.initializeEditor(editor);
			}else if(changeInfo.status === "loading" && editor.initialized){
				this.removeEditor(tabId);
			}
		});
		chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
			if(!sender.tab){
				return;
			}
			var editor = this.editors.find(e => e.tabId === sender.tab.id);
			if(!editor){
				return;
			}
			if(msg.focusPage){
				pages.focusPage(editor.pageId);
			}else if(msg.createdRule){
				var rule = msg.createdRule;
				rule = rules.saveNewRule(rule);
				rules.editRuleOnTab(sender.tab.id, rule);
				this.removeEditor(sender.tab.id);
				sendResponse({ruleSaved: true, rule: rule});
			}
		});
	}
	initializeEditor(editor){
		var page = pages.getPageById(editor.pageId);
		chrome.tabs.sendMessage(editor.tabId, {initialize: true, url: page.url, isNew: true});
		editor.initialized = true;
	}
	closeEditor(pageId){
		var index = this.editors.findIndex(e => e.pageId === pageId);
		if(index === -1){
			return;
		}
		var editor = this.editors[index];
		chrome.tabs.remove(editor.tabId);
		this.editors.splice(index, 1);
	}
	removeEditor(tabId){
		var index = this.editors.findIndex(e => e.tabId === tabId);
		if(index > -1){
			this.editors.splice(index, 1);
		}
	}
	createRuleForPage(pageId){
		var editor = this.editors.find(e => e.pageId === pageId);
		if(editor){
			chrome.tabs.update(editor.tabId, {active: true})
		}else{
			var page = pages.getPageById(pageId);
			page.onDestroyed.addListener(() => {
				this.closeEditor(pageId);
			});
			chrome.tabs.create({url: 'create-rule.html'}, (tab) => {
				console.log(`created an editor tab`)
				this.editors.push({pageId: pageId, tabId: tab.id, initialized: false});
			});
		}
	}
}
var ruleCreator = new PageRuleCreator();

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
			var info = page.getPopupInfo();
			chrome.runtime.sendMessage(undefined, {popupInfo: info})
		});
	}else if(msg.createRuleForPage){
		ruleCreator.createRuleForPage(msg.pageId);
	}
});