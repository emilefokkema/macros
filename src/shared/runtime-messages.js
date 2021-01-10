import { EventSource, MessagesSource, MessagesTarget } from './events';
import { PromiseResolver } from './promise-resolver';

class RuntimeMessagesEventSource extends EventSource{
	addListener(listener){
		chrome.runtime.onMessage.addListener(listener);
	}
	removeListener(listener){
		chrome.runtime.onMessage.removeListener(listener);
	}
}

var runtimeMessagesEventSource = new RuntimeMessagesEventSource();

class RuntimeMessagesSource extends MessagesSource{
	constructor(){
		super();
		this.source = runtimeMessagesEventSource.map((msg, sender, sendResponse) => [msg, sendResponse]);
	}
	onMessage(listener, cancellationToken){
		return this.source.listen(listener, cancellationToken);
	}
}

class ActiveTabMessagesTarget extends MessagesTarget{
	async sendMessageAsync(msg){
		var activeTabId = await this.getActiveTabId();
		return await this.sendMessageToTabAsync(activeTabId, msg);
	}
	sendMessage(msg){
		this.getActiveTabId().then(activeTabId => {
			chrome.tabs.sendMessage(activeTabId, msg);
		}, error => {
			console.error(error);
		});
	}
	sendMessageToTabAsync(tabId, msg){
		var resolver = new PromiseResolver();
		chrome.tabs.sendMessage(tabId, msg, resp => {
			var lastError = chrome.runtime.lastError;
			if(lastError){
				resolver.reject(`error when sending message to tab ${tabId}. Message: ${JSON.stringify(msg)}. Error: ${lastError.message}`);
			}else{
				resolver.resolve(resp);
			}
		});
		return resolver.promise;
	}
	sendMessageToTab(tabId, msg){
		chrome.tabs.sendMessage(tabId, msg);
	}
	getActiveTabId(){
		var resolver = new PromiseResolver();
		chrome.tabs.query({lastFocusedWindow: true, active: true}, tabs => {
			if(tabs.length !== 1){
				resolver.reject(new Error(`looked for the single active tab, but found ${tabs.length} tabs`));
				return;
			}
			resolver.resolve(tabs[0].id);
		});
		return resolver.promise;
	}
}

var activeTabMessagesTarget = new ActiveTabMessagesTarget();

class RuntimeMessagesTarget extends MessagesTarget{
	sendMessageAsync(msg){
		var resolver = new PromiseResolver();
		chrome.runtime.sendMessage(undefined, msg, resp => {
			var lastError = chrome.runtime.lastError;
			if(lastError){
				resolver.reject(`error when sending message. Message: ${JSON.stringify(msg)}. Error: ${lastError.message}`);
			}else{
				resolver.resolve(resp);
			}
		});
		return resolver.promise;
	}
	sendMessage(msg){
		chrome.runtime.sendMessage(undefined, msg);
	}
}

var runtimeMessagesSource = new RuntimeMessagesSource();
var runtimeMessagesTarget = new RuntimeMessagesTarget();

export { runtimeMessagesEventSource, runtimeMessagesSource, runtimeMessagesTarget, activeTabMessagesTarget };