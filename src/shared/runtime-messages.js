import { EventSource, Messages } from './events';
import { PromiseResolver } from './promise-resolver';

var responseTimeout = 4000;

class RuntimeMessagesSource extends EventSource{
	addListener(listener){
		chrome.runtime.onMessage.addListener(listener);
	}
	removeListener(listener){
		chrome.runtime.onMessage.removeListener(listener);
	}
	convertListener(listener){
		return (msg, sender, sendResponse) => {
			var responseSent = false;
			var sendResponseTimeout = setTimeout(() => {
				console.log(`no response was sent, so sending undefined in response to ${JSON.stringify(msg)}`)
				sendResponse(undefined);
			}, responseTimeout);
			var result = listener(msg, sender, (resp) => {
				clearTimeout(sendResponseTimeout);
				responseSent = true;
				sendResponse(resp);
			});
			if(!responseSent && result !== true){
				result = true;
			}
			return result;
		};
	}
}

var runtimeMessagesSource = new RuntimeMessagesSource();

class RuntimeMessages extends Messages{
	constructor(){
		super();
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