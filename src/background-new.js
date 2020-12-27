import { macros } from './shared/macros';
import { CancellationToken, Event } from './shared/events';
import { rules } from './rules';

var pageId = 0;

class Page{
	constructor(tab){
		this.pageId = pageId++;
		this.tab = tab;
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
	constructor(tab, contentScript, url){
		super(tab);
		this.contentScript = contentScript;
		this.url = url;
		this.initialize();
	}
	initialize(){
		this.contentScript.onPageInfoRequest((req, sendResponse) => {
			sendResponse({pageId: this.pageId});
		}, this.cancellationToken);
		this.contentScript.acknowledge();
	}
}

class PageCollection{
	constructor(){
		this.pages = [];
		macros.tabs.getAll(tabs => {
			for(let tabInfo of tabs){
				this.addPage(tabInfo.tab, tabInfo.url);
			}
		});
		macros.tabs.onTabStartedLoading.listen((tab, url) => {
			this.addPage(tab, url);
		});
	}
	async addPage(tab, url){
		var cancellationToken1 = new CancellationToken();
		var cancellationToken2 = new CancellationToken();
		tab.whenStartsLoading(cancellationToken2).then(() => cancellationToken1.cancel());
		var contentScript = await macros.contentScripts.getOnTab(tab, cancellationToken1);
		cancellationToken2.cancel();
		if(!contentScript || cancellationToken1.cancelled){
			return;
		}
		var page = new ModifyablePage(tab, contentScript, url);
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
}

var pages = new PageCollection();