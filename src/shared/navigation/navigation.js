import { PromiseResolver } from '../promise-resolver';
import { getNavigationId, getNavigationHistoryId } from './navigation-ids';

export class Navigation{
    constructor(tabId, frameId, url){
        this.id = getNavigationId(tabId, frameId, url);
        this.historyId = getNavigationHistoryId(tabId, frameId);
        this.url = url;
        this.tabId = tabId;
        this.frameId = frameId;
    }
    focus(){
        chrome.tabs.update(this.tabId, {active: true});
    }
    executeScriptAsync(url){
        var resolver = new PromiseResolver();
        chrome.tabs.executeScript(this.tabId, {file: url, runAt: 'document_start', frameId: this.frameId}, () => {
            var e = chrome.runtime.lastError;
			if(e !== undefined){
				resolver.reject(e.message);
			}else{
				resolver.resolve();
			}
        });
        return resolver.promise;
    }
}