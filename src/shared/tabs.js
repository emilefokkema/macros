import { EventSource, FilteredEventSource, MessageType } from './events';
import { runtimeMessagesSource, runtimeMessages } from './runtime-messages';
import { PromiseResolver } from './promise-resolver';

class TabUpdated extends EventSource{
	addListener(listener){
		chrome.tabs.onUpdated.addListener(listener);
	}
	removeListener(listener){
		chrome.tabs.onUpdated.removeListener(listener);
	}
}
class TabRemoved extends EventSource{
	addListener(listener){
		chrome.tabs.onRemoved.addListener(listener);
	}
	removeListener(listener){
		chrome.tabs.onRemoved.removeListener(listener);
	}
}

var tabUpdated = new TabUpdated();
var tabRemoved = new TabRemoved();

class MessagesToTab{
	constructor(tabId){
		this.tabId = tabId;
		this.messageSource = runtimeMessagesSource.map((msg, sender, sendResponse) => [msg, sendResponse]);
	}
	sendMessageAsync(msg){
		var resolver = new PromiseResolver();
		chrome.tabs.sendMessage(this.tabId, msg, resp => {
			var lastError = chrome.runtime.lastError;
			if(lastError){
				resolver.reject(`error when sending message to tab. Message: ${JSON.stringify(msg)}. Error: ${lastError.message}`);
			}else{
				resolver.resolve(resp);
			}
		});
		return resolver.promise;
	}
	onMessage(listener){
		return runtimeMessages.listen(listener);
	}
}

class MessagesFromTab{
	constructor(tabId){
		this.tabId = tabId;
		this.messageSource = runtimeMessagesSource.filter((msg, sender) => !!sender.tab && sender.tab.id === tabId).map((msg, sender, sendResponse) => [msg, sendResponse]);
	}
	sendMessageAsync(msg){
		return runtimeMessages.sendMessageAsync(msg);
	}
	onMessage(listener){
		return this.messageSource.listen(listener);
	}
}

class Tab{
	constructor(tabId){
		this.tabId = tabId;
		this.incomingMessages = new MessagesToTab(tabId);
		this.outgoingMessages = new MessagesFromTab(tabId);
	}
	whenRemoved(cancellationToken){
		return tabRemoved.when((tabId) => tabId === this.tabId, cancellationToken);
	}
	whenStartsLoading(cancellationToken){
		return tabUpdated.when((tabId, changeInfo) => tabId === this.tabId && changeInfo.status === "loading", cancellationToken);
	}
	executeScriptAsync(scriptUrl){
		var resolver = new PromiseResolver();
		chrome.tabs.executeScript(this.tabId, {file: scriptUrl, runAt: 'document_start'}, () => {
			var e = chrome.runtime.lastError;
			if(e !== undefined){
				resolver.reject(e.message);
			}else{
				resolver.resolve();
			}
		});
		return resolver.promise;
	}
}

var tabs = {
	onTabStartedLoading: tabUpdated.filter((_, changeInfo) => changeInfo.status === "loading").map((tabId, changeInfo, tab) => [new Tab(tabId), tab.url]),
	getAll(callback){
		chrome.tabs.query({}, tabs => {
			var mapped = tabs.map(t => ({
				tab: new Tab(t.id),
				url: t.url
			}));
			callback(mapped);
		});
	}
};

export { tabs };