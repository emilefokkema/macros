import { PromiseResolver } from '../promise-resolver';
import { Event, CancellationToken } from '../events';
import { runtimeMessagesTarget, TabMessagesTarget, runtimeMessagesEventSource } from '../runtime-messages';
import { tabRemoved } from '../tab-removed';
import { webNavigationCommitted, historyStateUpdatedOrReferenceFramentUpdated } from './navigation-event-sources';

function getFrame(tabId, frameId){
    var resolver = new PromiseResolver();
    chrome.webNavigation.getFrame({tabId, frameId}, details => resolver.resolve(details));
    return resolver.promise;
}

async function getParentFrameIds(tabId, frameId){
    var result = [];
    var latestFrameId = frameId;
    do{
        result.push(latestFrameId);
        var frame = await getFrame(tabId, latestFrameId);
        if(!frame){
            console.log(`no frame found for tabId ${tabId} and frame id ${latestFrameId}`)
            break;
        }
        latestFrameId = frame.parentFrameId;
    }while(latestFrameId !== -1)
    return result;
}

function getNavigationId(tabId, frameId, url){
    return `${tabId}:${frameId}:${url}`;
}

function getNavigationHistoryId(tabId, frameId){
    return `${tabId}:${frameId}`;
}

class Navigation{
    constructor(tabId, frameId, parentFrameIds, url, messagesTarget){
        this.id = getNavigationId(tabId, frameId, url);
        this.url = url;
        this.tabId = tabId;
        this.frameId = frameId;
        this.parentFrameIds = parentFrameIds;
        this.messagesTarget = messagesTarget;
        this.disappeared = new Event();
        this.cancellationToken = new CancellationToken();
        this.initialize();
    }
    initialize(){
        webNavigationCommitted.when(({tabId, frameId }) => tabId === this.tabId && this.parentFrameIds.some(fid => fid === frameId), this.cancellationToken).then(() => {
            this.disappear();
        });
        tabRemoved.when((tabId) => tabId === this.tabId, this.cancellationToken).then(() => {
            this.disappear();
        });
        historyStateUpdatedOrReferenceFramentUpdated.when(({tabId, frameId}) => tabId === this.tabId && frameId === this.frameId, this.cancellationToken).then(() => {
            this.disappear();
        });
    }
    focus(){
        chrome.tabs.update(this.tabId, {active: true});
    }
    disappear(){
        this.cancellationToken.cancel();
        this.disappeared.dispatch();
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
        var parentFrameIds = [frameId];
        var messagesTarget;
        if(await getFrame(tabId, frameId)){
            messagesTarget = new TabMessagesTarget(tabId);
            parentFrameIds = await getParentFrameIds(tabId, frameId);
        }else{
            messagesTarget = runtimeMessagesTarget;
        }
        
        return new Navigation(tabId, frameId, parentFrameIds, url, messagesTarget);
    }
}

var navigationMessagesEventSource = runtimeMessagesEventSource.filter((msg, sender) => !!sender.tab).mapAsync(async (msg, {frameId, tab, url}, sendResponse) => [msg, await Navigation.create(tab.id, frameId, url), sendResponse]);
var navigationCreated = webNavigationCommitted.mapAsync(async ({tabId, frameId, url}) => [await Navigation.create(tabId, frameId, url)]);
var navigationReplaced = historyStateUpdatedOrReferenceFramentUpdated.map(({tabId, frameId, url}) => [{navigationHistoryId: getNavigationHistoryId(tabId, frameId), newNavigationId: getNavigationId(tabId, frameId, url)}]);

export { Navigation, getNavigationId, getNavigationHistoryId, navigationMessagesEventSource, navigationCreated, navigationReplaced};