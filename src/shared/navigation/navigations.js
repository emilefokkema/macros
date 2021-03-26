import { PromiseResolver } from '../promise-resolver';
import { CombinedEventSource } from '../events';
import { runtimeMessagesTarget, TabMessagesTarget, runtimeMessagesEventSource } from '../runtime-messages';
import { tabRemoved } from '../tab-removed';
import { webNavigationCommitted, historyStateUpdatedOrReferenceFramentUpdated } from './navigation-event-sources';

function getFrame(tabId, frameId){
    var resolver = new PromiseResolver();
    chrome.webNavigation.getFrame({tabId, frameId}, details => resolver.resolve(details));
    return resolver.promise;
}

function getNavigationId(tabId, frameId, url){
    return `${tabId}:${frameId}:${url}`;
}

function getNavigationHistoryId(tabId, frameId){
    return `${tabId}:${frameId}`;
}

class Navigation{
    constructor(tabId, frameId, url, messagesTarget){
        this.id = getNavigationId(tabId, frameId, url);
        this.historyId = getNavigationHistoryId(tabId, frameId);
        this.url = url;
        this.tabId = tabId;
        this.frameId = frameId;
        this.messagesTarget = messagesTarget;
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
    static async create(tabId, frameId, url){
        var messagesTarget;
        if(await getFrame(tabId, frameId)){
            messagesTarget = new TabMessagesTarget(tabId);
        }else{
            messagesTarget = runtimeMessagesTarget;
        }
        
        return new Navigation(tabId, frameId, url, messagesTarget);
    }
}

var navigationMessagesEventSource = runtimeMessagesEventSource.filter((msg, sender) => !!sender.tab && sender.tab.id > 0).mapAsync(async (msg, {frameId, tab, url}, sendResponse) => [msg, await Navigation.create(tab.id, frameId, url), sendResponse]);
var navigationCreated = webNavigationCommitted.filter(({tabId, frameId, url}) => tabId > 0).mapAsync(async ({tabId, frameId, url}) => [await Navigation.create(tabId, frameId, url)]);
var navigationReplaced = historyStateUpdatedOrReferenceFramentUpdated.map(({tabId, frameId, url}) => [{navigationHistoryId: getNavigationHistoryId(tabId, frameId), newNavigationId: getNavigationId(tabId, frameId, url)}]);
var navigationDisappeared = new CombinedEventSource([
    webNavigationCommitted,
    tabRemoved,
    historyStateUpdatedOrReferenceFramentUpdated
])

export { Navigation, getNavigationId, getNavigationHistoryId, navigationMessagesEventSource, navigationCreated, navigationReplaced, navigationDisappeared};