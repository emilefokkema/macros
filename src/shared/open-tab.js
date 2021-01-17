import { PromiseResolver } from './promise-resolver';

function openTab(url){
    var resolver = new PromiseResolver();
    chrome.tabs.create({url}, t => {
        var e = chrome.runtime.lastError;
        if(e !== undefined){
            resolver.reject(e.message);
        }else{
            resolver.resolve(t.id);
        }
    });
    return resolver.promise;
}

export { openTab };