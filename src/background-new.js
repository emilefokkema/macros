import { macros } from './shared/macros';
import { CancellationToken } from './shared/events';

class PageCollection{
	constructor(){
		this.pages = [];
	}
	addPage(tab, url){
		console.log(`adding page on tab ${tab.tabId} with url ${url}`);
		var cancellationToken = new CancellationToken();
		tab.whenStartsLoading().then(() => cancellationToken.cancel());
		macros.contentScripts.getOnTab(tab).then(contentScript => {
			if(contentScript && !cancellationToken.cancelled){
				console.log(`got content script on tab ${tab.tabId} with url ${url}`);
			}
		});
	}
}

var pages = new PageCollection();

macros.tabs.getAll(tabs => {
	for(let tabInfo of tabs){
		pages.addPage(tabInfo.tab, tabInfo.url);
	}
});