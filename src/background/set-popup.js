var setPopup = function(url, tabId){
    if(tabId !== undefined){
        chrome.action.setPopup({
            tabId: tabId,
            popup: url
        });
    }else{
        chrome.action.setPopup({popup: url});
    }
};

export { setPopup };