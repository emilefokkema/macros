import { PromiseResolver } from '../promise-resolver';
import { MessageType, CancellationToken } from '../events';
import { runtimeMessagesEventSource, runtimeMessagesTarget } from '../runtime-messages';
import { Navigation, getNavigationId, getNavigationHistoryId, navigationCreated, navigationReplaced, navigationDisappeared} from './navigations';
import { crossBoundaryEventFactory } from '../cross-boundary-events';

var navigationReplacedMessage = crossBoundaryEventFactory.create('navigationReplaced');

try{
    navigationReplaced.listen(({navigationHistoryId, newNavigationId}) => {
        console.log(`navigation history '${navigationHistoryId}' has new navigation '${newNavigationId}'`);
        navigationReplacedMessage.target.sendMessage({navigationHistoryId, newNavigationId});
    });
}catch(e){

}

var getCurrentNavigationMessageType = new MessageType('getCurrentNavigation');


var getCurrentNavigationMessageTarget = runtimeMessagesTarget.ofType(getCurrentNavigationMessageType);


runtimeMessagesEventSource.filter((msg, sender) => !!sender.tab && sender.tab.id > 0 && getCurrentNavigationMessageType.filterMessage(msg)).listen((msg, sender, sendResponse) => {
    sendResponse({
        id: getNavigationId(sender.tab.id, sender.frameId, sender.url),
        historyId: getNavigationHistoryId(sender.tab.id, sender.frameId),
        tabId: sender.tab.id
    })
});

async function navigationExistsInTab(tabId, tabUrl, navigationId, cancellationToken){
    if(getNavigationId(tabId, 0, tabUrl) === navigationId){
        return true;
    }
    var frameInfos = await new Promise((resolve) => {
        chrome.webNavigation.getAllFrames({tabId}, resolve);
    });
    if(!frameInfos || cancellationToken.cancelled){
        return false;
    }
    for(let frameInfo of frameInfos){
        if(getNavigationId(tabId, frameInfo.frameId, frameInfo.url) === navigationId){
            return true;
        }
    }
    return false;
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
    getCurrent(){
        return getCurrentNavigationMessageTarget.sendMessageAsync({});
    },
    openTab(url){
        chrome.tabs.create({url});
    },
    navigationExists(navigationId){
        var cancellationToken = new CancellationToken();
        return new Promise((resolve) => {
            chrome.tabs.query({}, async tabs => {
                var found = false;
                var existsForEachTab = tabs.map(async t => {
                    var result = await navigationExistsInTab(t.id, t.url, navigationId, cancellationToken);
                    if(result){
                        cancellationToken.cancel();
                        found = true;
                        resolve(true);
                    }
                });
                await Promise.all(existsForEachTab);
                if(!found){
                    resolve(false);
                }
            });
        });
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
    getPopupTabId(){
        var resolver = new PromiseResolver();
        chrome.tabs.query({lastFocusedWindow: true, active: true}, tabs => {
            if(tabs.length !== 1){
                resolver.reject(new Error(`looked for the single active tab, but found ${tabs.length} tabs`));
                return;
            }
            resolver.resolve(tabs[0].id);
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
    },
    onReplaced(listener, cancellationToken){
        return navigationReplacedMessage.source.onMessage(listener, cancellationToken);
    },
    onDisappeared(listener, cancellationToken){
        return navigationDisappeared.listen(listener, cancellationToken);
    },
    whenDisappeared(navigationId){
        return navigationDisappeared.mapAsync(async () => [await this.navigationExists(navigationId)]).filter(e => !e).next();
    }
};

export { navigation };
