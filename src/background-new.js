import { macros } from './shared/macros';
import { CancellationToken, Event } from './shared/events';
import { rules } from './rules';
import { setPopup } from './shared/set-popup';

var pageId = 0;

setPopup('popup.html');

class Page{
	constructor(tab){
		this.pageId = pageId++;
		this.tab = tab;
		this.tabId = tab.tabId;
		this.cancellationToken = new CancellationToken();
		this.hasDisappeared = false;
		this.onDisappeared = new Event();
		Promise.any([
			this.tab.whenStartsLoading(this.cancellationToken),
			this.tab.whenRemoved(this.cancellationToken)
		]).then(() => {
			this.disappear();
		});
	}
	disappear(){
		if(this.hasDisappeared){
			return;
		}
		this.cancellationToken.cancel();
		this.hasDisappeared = true;
		this.onDisappeared.dispatch();
	}
}

class ModifyablePage extends Page{
	constructor(tab, url){
		super(tab);
		this.url = url;
	}
}

class PageCollection{
	constructor(){
		this.pages = [];
	}
	async addPage(tab, url){
		var page = new ModifyablePage(tab, url);
		this.pages.push(page);
		console.log(`added page at ${url} (page id ${page.pageId}). Current number of pages: ${this.pages.length}`)
		page.onDisappeared.listen(() => this.removePage(page));
	}
	removePage(page){
		var index = this.pages.indexOf(page);
		if(index > -1){
			this.pages.splice(index, 1);
			console.log(`removed page (page id ${page.pageId}). current number of pages: ${this.pages.length}`)
		}
	}
	getPageById(pageId){
		return this.pages.find(p => p.pageId === pageId);
	}
	getPageByTabId(tabId){
		return this.pages.find(p => p.tabId === tabId);
	}
}

var pages = new PageCollection();

async function tryExecuteContentScriptOnTab(tab){
	try{
		await tab.executeScriptAsync('content-script.js');
	}catch(e){
		console.log(`could not execute content script on tab: `, e);
	}
}

macros.tabs.getAll(tabs => {
	for(let tabInfo of tabs){
		pages.addPage(tabInfo.tab, tabInfo.url);
		tryExecuteContentScriptOnTab(tabInfo.tab);
	}
});
macros.tabs.onTabStartedLoading.listen((tab, url) => {
	pages.addPage(tab, url);
	tryExecuteContentScriptOnTab(tab);
});
macros.onPageRuleRequest((pageId, sendResponse) => {
	console.log(`macros requests rules for page ${pageId}`);
	var page = pages.getPageById(pageId);
	sendResponse(rules.getRulesForUrl(page.url));
});
macros.onPageIdForContentScriptRequest(({tabId}, sendResponse) => {
	if(tabId === undefined){
		return;
	}
	var page = pages.getPageByTabId(tabId);
	if(!page){
		return;
	}
	sendResponse(page.pageId);
});
macros.onPageIdForTabIdRequest((tabId, sendResponse) => {
	var page = pages.getPageByTabId(tabId);
	if(!page){
		return;
	}
	sendResponse(page.pageId);
});