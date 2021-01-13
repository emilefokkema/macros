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

class TabMessagesTarget extends MessagesTarget{
	constructor(tabId){
		super();
		this.tabId = tabId;
	}
	sendMessage(msg){
		chrome.tabs.sendMessage(this.tabId, msg);
	}
	sendMessageAsync(msg){
		var resolver = new PromiseResolver();
		chrome.tabs.sendMessage(this.tabId, msg, resp => {
			var lastError = chrome.runtime.lastError;
			if(lastError){
				resolver.reject(`error when sending message to tab ${tabId}. Message: ${JSON.stringify(msg)}. Error: ${lastError.message}`);
			}else{
				resolver.resolve(resp);
			}
		});
		return resolver.promise;
	}
}

class CurrentTabMessagesTarget extends MessagesTarget{
	async sendMessageAsync(msg){
		var messagesTarget = await this.getCurrentTabMessagesTarget();
		return await messagesTarget.sendMessageAsync(msg);
	}
	sendMessage(msg){
		this.getCurrentTabMessagesTarget().then(messagesTarget => {
			messagesTarget.sendMessage(msg);
		}, error => {
			console.error(error);
		});
	}
	getCurrentTabMessagesTarget(){
		var resolver = new PromiseResolver();
		chrome.tabs.query({lastFocusedWindow: true, active: true}, tabs => {
			if(tabs.length !== 1){
				resolver.reject(new Error(`looked for the single active tab, but found ${tabs.length} tabs`));
				return;
			}
			resolver.resolve(new TabMessagesTarget(tabs[0].id));
		});
		return resolver.promise;
	}
}

var currentTabMessagesTarget = new CurrentTabMessagesTarget();

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

export { runtimeMessagesEventSource, runtimeMessagesSource, runtimeMessagesTarget, currentTabMessagesTarget, TabMessagesTarget };