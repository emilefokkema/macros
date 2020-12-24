import { EventSource, FilteredEventSource } from './events';

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
class RuntimeMessages extends EventSource{
	addListener(listener){
		chrome.runtime.onMessage.addListener(listener);
	}
	removeListener(listener){
		chrome.runtime.onMessage.removeListener(listener);
	}
}

var runtimeMessages = new RuntimeMessages();
var tabUpdated = new TabUpdated();
var tabRemoved = new TabRemoved();

class MessagesFromTab extends FilteredEventSource{
	constructor(tabId){
		super(runtimeMessages);
		this.tabId = tabId;
	}
	filter(msg, sender){
		return !!sender.tab && sender.tab.tabId === this.tabId;
	}
}

class Tab{
	constructor(tabId){
		this.tabId = tabId;
		this.onMessage = new MessagesFromTab(tabId);
	}
	whenRemoved(cancellationToken){
		return tabRemoved.when((tabId) => tabId === this.tabId, cancellationToken);
	}
	whenStartsLoading(cancellationToken){
		return tabUpdated.when((tabId, changeInfo) => tabId === this.tabId && changeInfo.status === "loading", cancellationToken);
	}
}

var tabs = {
	onTabStartedLoading: tabUpdated.filter((_, changeInfo) => changeInfo.status === "loading").map((tabId, changeInfo, tab) => [new Tab(tabId), tab.url])
};

export { tabs };