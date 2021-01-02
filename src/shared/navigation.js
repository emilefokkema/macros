import { PromiseResolver } from './promise-resolver';
import { EventSource, MessageType } from './events';
import { runtimeMessagesEventSource, runtimeMessagesTarget } from './runtime-messages';

function getNavigationId(tabId, frameId){
    return `${tabId}:${frameId}`;
}

var getNavigationIdMessageType = new MessageType('getNavigationId');
var getNavigationIdMessageTarget = runtimeMessagesTarget.ofType(getNavigationIdMessageType);

runtimeMessagesEventSource.filter((msg, sender) => !!sender.tab && getNavigationIdMessageType.filterMessage(msg)).listen((msg, sender, sendResponse) => {
    sendResponse(getNavigationId(sender.tab.id, sender.frameId));
});

class Navigation{
    constructor(tabId, frameId, url){
        this.url = url;
        this.tabId = tabId;
        this.frameId = frameId;
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

class WebNavigationCommitted extends EventSource{
    addListener(listener){
        chrome.webNavigation.onCommitted.addListener(listener);
    }
    removeListener(listener){
        chrome.webNavigation.onCommitted.removeListener(listener);
    }
}

var navigationCreated = new WebNavigationCommitted().map(({tabId, frameId, url}) => [new Navigation(tabId, frameId, url)]);

var navigation = {
    getId(){
        return getNavigationIdMessageTarget.sendMessageAsync({});
    },
    getAllForTab(tabId){
        var resolver = new PromiseResolver();
        chrome.webNavigation.getAllFrames({tabId}, info => {
            resolver.resolve(info.map(i => new Navigation(tabId, i.frameId, i.url)));
        });
        return resolver.promise;
    },
    getTabIdForNavigation(navigationId){
        var resolver = new PromiseResolver();
        chrome.tabs.query({}, tabs => {
            for(let tab of tabs){
                chrome.webNavigation.getAllFrames({tabId: tab.id}, info => {
                    for(let frameInfo of info){
                        if(getNavigationId(tab.id, frameInfo.frameId) === navigationId){
                            resolver.resolve(tab.id);
                        }
                    }
                });
            }
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