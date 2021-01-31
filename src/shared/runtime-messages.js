import { EventSource, MessagesSource, MessagesTarget, Event } from './events';
import { PromiseResolver } from './promise-resolver';
import { tabRemoved } from './tab-removed';

function tabExists(tabId){
	var resolver = new PromiseResolver();
	chrome.tabs.get(tabId, (t) => {
		var lastError = chrome.runtime.lastError;
		resolver.resolve(!!t && !lastError);
	});
	return resolver.promise;
}
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
		this.disappeared = new Event();
		tabRemoved.when((_tabId) => _tabId === this.tabId).then(() => {
            this.disappeared.dispatch();
        });
	}
	sendMessage(msg){
		chrome.tabs.sendMessage(this.tabId, msg);
	}
	sendMessageAsync(msg){
		var resolver = new PromiseResolver();
		chrome.tabs.sendMessage(this.tabId, msg, resp => {
			var lastError = chrome.runtime.lastError;
			if(lastError){
				resolver.reject(`error when sending message to tab ${this.tabId}. Message: ${JSON.stringify(msg)}. Error: ${lastError.message}`);
			}else{
				resolver.resolve(resp);
			}
		});
		return resolver.promise;
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

class CombinedMessagesTarget extends MessagesTarget{
	constructor(){
		super();
		this.tabMessagesTargets = [];
		this.updated = new Event();
	}
	get empty(){return this.tabMessagesTargets.length === 0;}
	getTargets(){
		return [runtimeMessagesTarget].concat(this.tabMessagesTargets);
	}
	sendMessageAsync(msg){
		var resolver = new PromiseResolver();
		var targets = this.getTargets();
		for(let target of targets){
			target.sendMessageAsync(msg).then(v => resolver.resolve(v), e => {});
		}
		return resolver.promise;
	}
	sendMessage(msg){
		for(var target of this.getTargets()){
			target.sendMessage(msg);
		}
	}
	toJSON(){
		return this.tabMessagesTargets.map(tt => tt.tabId);
	}
	async load(tabIds){
		var existingTabIds = (await Promise.all(tabIds.map(async (id) => ({id: id, exists: await tabExists(id)})))).filter(r => r.exists).map(r => r.id);
		for(let existingTabId of existingTabIds){
			var target = new TabMessagesTarget(existingTabId);
			this.tabMessagesTargets.push(target);
			target.disappeared.listen(() => this.removeTarget(target));
		}
	}
	removeTarget(target){
		var index = this.tabMessagesTargets.indexOf(target);
		if(index > -1){
			this.tabMessagesTargets.splice(index, 1);
			this.updated.dispatch();
		}
	}
	addTarget(target){
		if(target instanceof TabMessagesTarget && !this.tabMessagesTargets.some(tt => tt.tabId === target.tabId)){
			this.tabMessagesTargets.push(target);
			target.disappeared.listen(() => this.removeTarget(target));
			this.updated.dispatch();
		}
	}
}

export { runtimeMessagesEventSource, runtimeMessagesSource, runtimeMessagesTarget, TabMessagesTarget, CombinedMessagesTarget };