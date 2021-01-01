import { PromiseResolver } from './promise-resolver';

class Navigation{
    constructor(tabId, frameId){
        this.tabId = tabId;
        this.frameId = frameId;
    }
}

function getAllFramesForTab(tabId){
    
}

var navigation = {
    getAll(){
        var resolver = new PromiseResolver();
        chrome.tabs.query({}, tabs => {
            var result = [];
            for(let tab of tabs){

            }
        });
        return resolver.promise;
    }
};

export { navigation };