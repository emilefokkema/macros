import { EventSource } from './events';

class RuntimeMessages extends EventSource{
	addListener(listener){
		chrome.runtime.onMessage.addListener(listener);
	}
	removeListener(listener){
		chrome.runtime.onMessage.removeListener(listener);
	}
}

class RuntimeMessageSender{
	sendMessage(msg, responseCallback){
		chrome.runtime.sendMessage(undefined, msg, responseCallback);
	}
}

var runtimeMessages = new RuntimeMessages();
var runtimeMessageSender = new RuntimeMessageSender();

export { runtimeMessages, runtimeMessageSender };