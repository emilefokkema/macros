import { PromiseResolver } from './promise-resolver';
import { EventSource, MessageType, Event, CancellationToken } from './events';
import { runtimeMessagesEventSource, runtimeMessagesTarget } from './runtime-messages';

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

class WebNavigationCommitted extends EventSource{
    addListener(listener){
        chrome.webNavigation.onCommitted.addListener(listener);
    }
    removeListener(listener){
        chrome.webNavigation.onCommitted.removeListener(listener);
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

var webNavigationCommitted = new WebNavigationCommitted();
var tabRemoved = new TabRemoved();

class Navigation{
    constructor(tabId, frameId, parentFrameIds, url){
        this.url = url;
        this.tabId = tabId;
        this.frameId = frameId;
        this.parentFrameIds = parentFrameIds;
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
        var parentFrameIds = await getParentFrameIds(tabId, frameId);
        return new Navigation(tabId, frameId, parentFrameIds, url);
    }
}

var navigationCreated = webNavigationCommitted.mapAsync(async ({tabId, frameId, url}) => [await Navigation.create(tabId, frameId, url)]);

function getNavigationId(tabId, frameId, url){
    return `${tabId}:${frameId}:${url}`;
}

var getNavigationIdMessageType = new MessageType('getNavigationId');
var getNavigationIdMessageTarget = runtimeMessagesTarget.ofType(getNavigationIdMessageType);

runtimeMessagesEventSource.filter((msg, sender) => !!sender.tab && getNavigationIdMessageType.filterMessage(msg)).listen((msg, sender, sendResponse) => {
    sendResponse(getNavigationId(sender.tab.id, sender.frameId, sender.url));
});

var navigation = {
    getId(){
        return getNavigationIdMessageTarget.sendMessageAsync({});
    },
    getNavigation(navigationId){
        var resolver = new PromiseResolver();
        chrome.tabs.query({}, tabs => {
            for(let tab of tabs){
                chrome.webNavigation.getAllFrames({tabId: tab.id}, info => {
                    for(let frameInfo of info){
                        if(getNavigationId(tab.id, frameInfo.frameId, frameInfo.url) === navigationId){
                            Navigation.create(tab.id, frameInfo.frameId, frameInfo.url).then(navigation => resolver.resolve(navigation));
                        }
                    }
                });
            }
        });
        return resolver.promise;
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

export { navigation };
