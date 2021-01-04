var buttonInteraction = {
    setBadgeText({tabId, text}){
        chrome.browserAction.setBadgeText({tabId, text}, () => {
            var lastError = chrome.runtime.lastError;
            if(lastError){
                console.log(`there was an error setting browser action badge text for tab ${tabId}: ${e.message}`);
            }
        });
    },
    setBadgeBackgroundColor({tabId, color}){
        chrome.browserAction.setBadgeBackgroundColor({tabId, color}, () => {
            var lastError = chrome.runtime.lastError;
            if(lastError){
                console.log(`there was an error setting browser action background color for tab ${tabId}: ${e.message}`);
            }
        });
    }
};

export { buttonInteraction };