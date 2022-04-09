export class TabCollection{
    openTab(url){
        chrome.tabs.create({url});
    }
    getAllTabs(){
        return new Promise((resolve) => chrome.tabs.query({}, resolve));
    }
    getTabByUrl(url){
        return new Promise((res) => {
            chrome.tabs.query({}, tabs => {
                res(tabs.find(t => t.url === url));
            });
        });
    }
    getAllFramesInTab(tabId){
        return new Promise((resolve) => chrome.webNavigation.getAllFrames({tabId}, resolve));
    }
    getCurrentlyActiveTab(){
        return new Promise((resolve, reject) => {
            chrome.tabs.query({active: true, currentWindow: true}, tabs => {
                if(tabs.length !== 1){
                    reject(new Error(`looked for the single active tab, but found ${tabs.length} tabs`));
                    return;
                }
                resolve(tabs[0]);
            });
        });
    }
    getPopupTabId(){
        return new Promise((resolve, reject) => {
            chrome.tabs.query({lastFocusedWindow: true, active: true}, tabs => {
                if(tabs.length !== 1){
                    reject(new Error(`looked for the single active tab, but found ${tabs.length} tabs`));
                    return;
                }
                resolve(tabs[0].id);
            });
        });
    }
    tabExists(tabId){
        return new Promise(resolve => {
            chrome.tabs.get(tabId, t => {
                var lastError = chrome.runtime.lastError;
                resolve(!!t && !lastError);
            });
        });
    }
}