import { EventSource } from './events';
import { PromiseResolver } from './promise-resolver';

class RuntimeMessagesSource extends EventSource{
	addListener(listener){
		chrome.runtime.onMessage.addListener(listener);
	}
	removeListener(listener){
		chrome.runtime.onMessage.removeListener(listener);
	}
}

var runtimeMessagesSource = new RuntimeMessagesSource();

class RuntimeMessages{
	constructor(){
		this.source = runtimeMessagesSource.map((msg, sender, sendResponse) => [msg, sendResponse]);
	}
	onMessage(listener){
		return this.source.listen(listener);
	}
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
}

var runtimeMessages = new RuntimeMessages();

export { runtimeMessagesSource, runtimeMessages };