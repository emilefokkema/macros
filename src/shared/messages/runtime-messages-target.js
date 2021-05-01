import { MessagesTarget } from '../events';

export class RuntimeMessagesTarget extends MessagesTarget{
	sendMessageAsync(msg){
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(undefined, msg, resp => {
                var lastError = chrome.runtime.lastError;
                if(lastError){
                    reject(`error when sending message. Message: ${JSON.stringify(msg)}. Error: ${lastError.message}`);
                }else{
                    resolve(resp);
                }
            });
        });
	}
	sendMessage(msg){
		chrome.runtime.sendMessage(undefined, msg);
	}
}