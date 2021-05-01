export function getNavigationId(tabId, frameId, url){
    return `${tabId}:${frameId}:${url}`;
}

export function getNavigationHistoryId(tabId, frameId){
    return `${tabId}:${frameId}`;
}