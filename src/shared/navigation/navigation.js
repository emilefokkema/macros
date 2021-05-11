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
}
