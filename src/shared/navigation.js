import { PromiseResolver } from './promise-resolver';
import { EventSource, MessageType, Event, CancellationToken } from './events';
import { runtimeMessagesEventSource, runtimeMessagesTarget, TabMessagesTarget } from './runtime-messages';
import { tabRemoved } from './tab-removed';

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

class WebNavigationCommitted extends EventSource{
    addListener(listener){
        chrome.webNavigation.onCommitted.addListener(listener);
    }
    removeListener(listener){
        chrome.webNavigation.onCommitted.removeListener(listener);
    }
}

var webNavigationCommitted = new WebNavigationCommitted();


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

var navigationCreated = webNavigationCommitted.mapAsync(async ({tabId, frameId, url}) => [await Navigation.create(tabId, frameId, url)]);

var getNavigationIdMessageType = new MessageType('getNavigationId');
var getNavigationIdMessageTarget = runtimeMessagesTarget.ofType(getNavigationIdMessageType);

runtimeMessagesEventSource.filter((msg, sender) => !!sender.tab && getNavigationIdMessageType.filterMessage(msg)).listen((msg, sender, sendResponse) => {
    sendResponse(getNavigationId(sender.tab.id, sender.frameId, sender.url));
});

var navigationMessagesEventSource = runtimeMessagesEventSource.filter((msg, sender) => !!sender.tab).mapAsync(async (msg, {frameId, tab, url}, sendResponse) => [msg, await Navigation.create(tab.id, frameId, url), sendResponse]);

function getPopupTabId(){
    var resolver = new PromiseResolver();
    chrome.tabs.query({lastFocusedWindow: true, active: true}, tabs => {
        if(tabs.length !== 1){
            resolver.reject(new Error(`looked for the single active tab, but found ${tabs.length} tabs`));
            return;
        }
        resolver.resolve(tabs[0].id);
    });
    return resolver.promise;
}

function findNavigationInTab(tabId, tabUrl, navigationId, cancellationToken){
    if(getNavigationId(tabId, 0, tabUrl) === navigationId){
        return Navigation.create(tabId, 0, tabUrl);
    }
    var resolver = new PromiseResolver();
    var found = false;
    chrome.webNavigation.getAllFrames({tabId}, info => {
        if(cancellationToken.cancelled){
            resolver.resolve(null);
            return;
        }
        for(let frameInfo of info){
            if(getNavigationId(tabId, frameInfo.frameId, frameInfo.url) === navigationId){
                found = true;
                Navigation.create(tabId, frameInfo.frameId, frameInfo.url).then(navigation => resolver.resolve(navigation));
            }
        }
        if(!found){
            resolver.resolve(null);
        }
    });
    return resolver.promise;
}

var navigation = {
    getId(){
        return getNavigationIdMessageTarget.sendMessageAsync({});
    },
    openTab(url){
        var resolver = new PromiseResolver();
        chrome.tabs.create({url}, tab => {
            navigationCreated.when(n => n.tabId === tab.id).then(([n]) => resolver.resolve(n));
        });
        return resolver.promise;
    },
    getNavigation(navigationId){
        var resolver = new PromiseResolver();
        var cancellationToken = new CancellationToken();
        chrome.tabs.query({}, tabs => {
            Promise.all(tabs.map(t => findNavigationInTab(t.id, t.url, navigationId, cancellationToken).then(result => {
                if(result){
                    cancellationToken.cancel();
                    resolver.resolve(result);
                }
            }))).then(() => resolver.resolve(null));
        });
        return resolver.promise;
    },
    async getAllForPopupTab(){
        return await this.getAllForTab(await getPopupTabId());
    },
    getAllForTab(tabId){
        var resolver = new PromiseResolver();
        chrome.webNavigation.getAllFrames({tabId}, info => {
            Promise.all(info.map(i => Navigation.create(tabId, i.frameId, i.url))).then(navigations => resolver.resolve(navigations));
        });
        return resolver.promise;
    },
    getAll(){
        var resolver = new PromiseResolver();
        chrome.tabs.query({}, tabs => {
            Promise.all(tabs.map(t => this.getAllForTab(t.id))).then(all => resolver.resolve(all.reduce((a, b) => a.concat(b), [])));
        });
        return resolver.promise;
    },
    onCreated(listener, cancellationToken){
        return navigationCreated.listen(listener, cancellationToken);
    }
};

export { navigation, navigationMessagesEventSource };
