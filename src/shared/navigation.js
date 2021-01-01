import { PromiseResolver } from './promise-resolver';
import { EventSource } from './events';

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

var webNavigationCommitted = new WebNavigationCommitted().map(({tabId, frameId, url}) => [new Navigation(tabId, frameId, url)]);

function getAllFramesForTab(tabId){
    var resolver = new PromiseResolver();
    chrome.webNavigation.getAllFrames({tabId}, info => {
        resolver.resolve(info.map(i => ({frameId: i.frameId, url: i.url})));
    });
    return resolver.promise;
}

var navigation = {
    getAll(){
        var resolver = new PromiseResolver();
        chrome.tabs.query({}, tabs => {
            Promise.all(tabs.map(async t => (await getAllFramesForTab(t.id)).map(({frameId, url}) => new Navigation(t.id, frameId, url)))).then(all => resolver.resolve(all.reduce((a, b) => a.concat(b), [])));
        });
        return resolver.promise;
    },
    onCreated(listener, cancellationToken){
        return webNavigationCommitted.listen(listener, cancellationToken);
    }
};

export { navigation };