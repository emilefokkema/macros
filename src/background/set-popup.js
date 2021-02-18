var setPopup = function(url, tabId){
    if(tabId !== undefined){
        chrome.browserAction.setPopup({
            tabId: tabId,
            popup: url
        });
    }else{
        chrome.browserAction.setPopup({popup: url});
    }
};

export { setPopup };