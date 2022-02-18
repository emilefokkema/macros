var buttonInteraction = {
    setBadgeText({tabId, text}){
        chrome.action.setBadgeText({tabId, text}, () => {
            var lastError = chrome.runtime.lastError;
            if(lastError){
                console.log(`there was an error setting browser action badge text for tab ${tabId}: ${lastError.message}`);
            }
        });
    },
    setBadgeBackgroundColor({tabId, color}){
        chrome.action.setBadgeBackgroundColor({tabId, color}, () => {
            var lastError = chrome.runtime.lastError;
            if(lastError){
                console.log(`there was an error setting browser action background color for tab ${tabId}: ${lastError.message}`);
            }
        });
    }
};

export { buttonInteraction };