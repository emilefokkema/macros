var buttonInteraction = {
    setBadgeText({tabId, text}){
        chrome.browserAction.setBadgeText({tabId, text});
    },
    setBadgeBackgroundColor({tabId, color}){
        chrome.browserAction.setBadgeBackgroundColor({tabId, color});
    }
};

export { buttonInteraction };