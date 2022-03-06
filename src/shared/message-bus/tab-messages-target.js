import { MessagesTarget } from '../events';

export class TabMessagesTarget extends MessagesTarget{
    constructor(tabId){
        super();
        this.tabId = tabId;
    }
    sendMessage(msg){
		chrome.tabs.sendMessage(this.tabId, msg, () => {
            var lastError = chrome.runtime.lastError;
        });
	}
    sendMessageAsync(msg){
        return new Promise((resolve, reject) => {
            chrome.tabs.sendMessage(this.tabId, msg, resp => {
                var lastError = chrome.runtime.lastError;
                if(lastError){
                    reject(`error when sending message to tab ${this.tabId}. Message: ${JSON.stringify(msg)}. Error: ${lastError.message}`);
                }else{
                    resolve(resp);
                }
            });
        });
    }
}