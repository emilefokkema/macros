import { EventSource, FilteredEventSource, MessageType } from './events';
import { runtimeMessages } from './runtime-messages';

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

class Tab{
	constructor(tabId){
		this.tabId = tabId;
		this.onMessage = runtimeMessages.filter((msg, sender) => !!sender.tab && sender.tab.tabId === tabId).map((msg, sender, sendResponse) => [msg, sendResponse]);
	}
	onMessageOfType(type){
		var messageType = new MessageType(type);
		return this.onMessage.filter((msg) => messageType.filterMessage(msg)).map((msg, sendResponse) => [messageType.unpackMessage(msg), sendResponse]);
	}
	whenRemoved(cancellationToken){
		return tabRemoved.when((tabId) => tabId === this.tabId, cancellationToken);
	}
	whenStartsLoading(cancellationToken){
		return tabUpdated.when((tabId, changeInfo) => tabId === this.tabId && changeInfo.status === "loading", cancellationToken);
	}
	executeScriptAsync(scriptUrl){
		var resolve, reject, promise = new Promise((res, rej) => {resolve = res;reject = rej;});
		chrome.tabs.executeScript(this.tabId, {file: scriptUrl, runAt: 'document_start'}, () => {
			var e = chrome.runtime.lastError;
			if(e !== undefined){
				reject(e.message);
			}else{
				resolve();
			}
		});
		return promise;
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