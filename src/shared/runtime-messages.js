import { EventSource, MessagesSource, MessagesTarget } from './events';
import { PromiseResolver } from './promise-resolver';

var responseTimeout = 4000;

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

export { runtimeMessagesEventSource, runtimeMessagesSource, runtimeMessagesTarget };