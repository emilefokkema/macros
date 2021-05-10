import { PromiseResolver } from './promise-resolver';

class EventSource {
	listen(listener, cancellationToken){
		this.addListener(listener);
		var cancel = () => this.removeListener(listener);
		if(cancellationToken){
			cancellationToken.onCancelled(cancel);
		}
		return { cancel };
	}
	filter(filter){
		return new FilteredEventSourceWithDelegate(this, filter);
	}
	map(map){
		return new MappedEventSourceWithDelegate(this, map);
	}
	mapAsync(mapAsync){
		return new AsyncMappedEventSource(this, mapAsync);
	}
	compare(getInitialArgs){
		return new ComparingEventSource(this, getInitialArgs);
	}
	when(predicate, cancellationToken){
		var resolve;
		var promise = new Promise((res) => {resolve = res;});
		var listener = this.listen(function(){
			var args = [].slice.apply(arguments);
			if(predicate.apply(null, args)){
				listener.cancel();
				resolve(args);
			}
		}, cancellationToken);
		return promise;
	}
	next(cancellationToken){
		return this.when(() => true, cancellationToken)
	}
	debounce(interval){
		return new DebouncedEvent(this, interval);
	}
}

class ComparingEventSource extends EventSource{
	constructor(source, getInitialArgs){
		super();
		this.source = source;
		this.getInitialArgs = getInitialArgs;
	}
	listen(listener, cancellationToken){
		var latestArgs = this.getInitialArgs();
		return this.source.listen(function(){
			var args = Array.prototype.slice.apply(arguments);
			var result = listener(latestArgs, args);
			latestArgs = args;
			return result; 
		}, cancellationToken);
	}
}

class SourceAndListeners{
	constructor(source){
		this.source = source;
		this.listenersAndCancellationTokensAndSubscriptions = [];
	}
	cancelSubscriptionForListener(listener){
		var removedListenerAndCancellationTokenAndSubscription = this.removeListener(listener);
		if(removedListenerAndCancellationTokenAndSubscription){
			removedListenerAndCancellationTokenAndSubscription.subscription.cancel();
		}
	}
	removeListener(listener){
		var index = this.listenersAndCancellationTokensAndSubscriptions.findIndex(l => l.listener === listener);
		if(index === -1){
			return null;
		}
		var [listenerAndCancellationTokenAndSubscription] = this.listenersAndCancellationTokensAndSubscriptions.splice(index, 1);
		return listenerAndCancellationTokenAndSubscription;
	}
	listen(listener, cancellationToken){
		var subscription = this.source.listen(listener, cancellationToken);
		var listenerAndCancellationTokenAndSubscription = {listener, cancellationToken, subscription};
		if(cancellationToken){
			cancellationToken.onCancelled(() => this.removeListener(listener));
		}
		this.listenersAndCancellationTokensAndSubscriptions.push(listenerAndCancellationTokenAndSubscription);
		return {
			cancel: () => this.cancelSubscriptionForListener(listener)
		};
	}
	cancel(){
		for(let listenerAndCancellationTokenAndSubscription of this.listenersAndCancellationTokensAndSubscriptions){
			listenerAndCancellationTokenAndSubscription.subscription.cancel();
		}
	}
}
class CombinedEventSource extends EventSource{
	constructor(sources){
		super();
		this.sourcesAndListeners = sources.map(s => new SourceAndListeners(s));
		this.listenersAndCancellationTokens = [];
	}
	removeListener(listener){
		var index = this.listenersAndCancellationTokens.findIndex(l => l.listener === listener);
		if(index === -1){
			return;
		}
		this.listenersAndCancellationTokens.splice(index, 1);
	}
	addSource(source){
		var sourceAndListeners = new SourceAndListeners(source);
		for(let {listener, cancellationToken} of this.listenersAndCancellationTokens){
			sourceAndListeners.listen(listener, cancellationToken);
		}
		this.sourcesAndListeners.push(sourceAndListeners);
	}
	removeSource(source){
		var index = this.sourcesAndListeners.findIndex(s => s.source === source);
		if(index === -1){
			return;
		}
		var [sourceAndListeners] = this.sourcesAndListeners.splice(index, 1);
		sourceAndListeners.cancel();
	}
	listen(listener, cancellationToken){
		for(let sourceAndListener of this.sourcesAndListeners){
			sourceAndListener.listen(listener, cancellationToken);
		}
		if(cancellationToken){
			cancellationToken.onCancelled(() => this.removeListener(listener));
		}
		this.listenersAndCancellationTokens.push({listener, cancellationToken});
		return {
			cancel: () => {
				for(let sourceAndListener of this.sourcesAndListeners){
					sourceAndListener.cancelSubscriptionForListener(listener);
				}
				this.removeListener(listener);
			}
		};
	}
}
class AsyncMappedEventSource extends EventSource{
	constructor(eventSource, mapAsync){
		super();
		this.eventSource = eventSource;
		this.mapAsync = mapAsync;
	}
	listen(listener, cancellationToken){
		var self = this;
		return this.eventSource.listen(function(){
			var args = Array.prototype.slice.apply(arguments);
			self.mapAsync(...args).then(mapped => {
				if(mapped){
					listener(...mapped)
				}else{
					listener();
				}
			});
		}, cancellationToken)
	}
}
class MappedEventSource extends EventSource{
	constructor(eventSource){
		super();
		this.eventSource = eventSource;
	}
	listen(listener, cancellationToken){
		var self = this;
		return this.eventSource.listen(function(){
			var args = Array.prototype.slice.apply(arguments);
			var mapped = self.map(...args);
			return listener(...mapped);
		}, cancellationToken);
	}
}
class FilteredEventSource extends EventSource{
	constructor(eventSource){
		super();
		this.eventSource = eventSource;
	}
	listen(listener, cancellationToken){
		var self = this;
		return this.eventSource.listen(function(){
			var args = Array.prototype.slice.apply(arguments);
			if(!self.filter(...args)){
				return;
			}

			return listener(...args);
		}, cancellationToken);
	}
}
class FilteredEventSourceWithDelegate extends FilteredEventSource{
	constructor(eventSource, filter){
		super(eventSource);
		this.filter = filter;
	}
}
class MappedEventSourceWithDelegate extends MappedEventSource{
	constructor(eventSource, map){
		super(eventSource);
		this.map = map;
	}
}
class Event extends EventSource{
	constructor(){
		super();
		this.listeners = [];
	}
	addListener(listener){
		this.listeners.push(listener);
	}
	removeListener(listener){
		var index = this.listeners.indexOf(listener);
		if(index > -1){
			this.listeners.splice(index, 1)
		}
	}
	dispatch(){
		var args = Array.prototype.slice.apply(arguments);
		for(let listener of this.listeners.slice()){
			listener(...args);
		}
	}
}
class DebouncedEvent extends Event{
	constructor(originalEventSource, interval){
		super();
		this.originalEventSource = originalEventSource;
		this.interval = interval;
		this.currentTimeout = undefined;
		this.subscription = undefined;
		this.latestArgs = undefined;
		this.waiting = false;
	}
	addListener(listener){
		super.addListener(listener);
		this.start();
	}
	removeListener(listener){
		super.removeListener(listener);
		if(this.listeners.length === 0){
			this.stop();
		}
	}
	renewTimeout(){
		if(this.currentTimeout !== undefined){
			clearTimeout(this.currentTimeout);
		}
		this.currentTimeout = setTimeout(() => {
			this.dispatch(...this.latestArgs);
			this.waiting = false;
			this.currentTimeout = undefined;
		}, this.interval);
		this.waiting = true;
	}
	start(){
		this.subscription = this.originalEventSource.listen((...args) => {
			this.latestArgs = args;
			this.renewTimeout();
		});
	}
	stop(){
		if(this.currentTimeout !== undefined){
			clearTimeout(this.currentTimeout);
		}
		if(this.subscription){
			this.subscription.cancel();
		}
	}
}
class CancellationToken extends Event{
	constructor(){
		super();
		this.cancelled = false;
	}
	dispatch(){
		if(this.cancelled){
			return;
		}
		this.cancelled = true;
		for(let listener of this.listeners){
			listener();
		}
		this.listeners = [];
	}
	onCancelled(listener){
		return this.listen(listener);
	}
	cancel(){
		this.dispatch();
	}
}
class MessageType{
	constructor(type){
		this.type = type;
	}
	filterMessage(msg){
		return msg.type === this.type;
	}
	unpackMessage(msg){
		return msg.message;
	}
	packMessage(msg){
		return {
			type: this.type,
			message: msg
		};
	}
	toString(){
		return this.type;
	}
}
class MessagesSource{
	onMessage(listener, cancellationToken){
		return {cancel(){}};
	}
	nextMessage(cancellationToken){
		var resolver = new PromiseResolver();
		var listener = this.onMessage((msg) => {
			listener.cancel();
			resolver.resolve(msg);
		}, cancellationToken);
		return resolver.promise;
	}
	ofType(messageType){
		return new MessagesSourceOfType(this, messageType);
	}
}
class MessagesTarget{
	async sendMessageAsync(msg){}
	sendMessage(msg){}
	ofType(messageType){
		return new MessagesTargetOfType(this, messageType);
	}
}
class EventMessagesSource extends MessagesSource{
	constructor(event){
		super();
		this.event = event;
	}
	onMessage(listener, cancellationToken){
		return this.event.listen(listener, cancellationToken);
	}
}
class EventMessagesTarget extends MessagesTarget{
	constructor(event){
		super();
		this.event = event;
	}
	async sendMessageAsync(msg){
		var resolver = new PromiseResolver();
		var responseSent = false;
		this.event.dispatch(msg, sendResponse);
		function sendResponse(response){
			if(responseSent){
				return;
			}
			responseSent = true;
			resolver.resolve(response);
		}
		return resolver.promise;
	}
	sendMessage(msg){
		this.event.dispatch(msg);
	}
}

class MessagesSourceOfType extends MessagesSource{
	constructor(messagesSource, messageType){
		super();
		this.messagesSource = messagesSource;
		this.messageType = messageType;
	}
	onMessage(listener, cancellationToken){
		return this.messagesSource.onMessage((msg, sendResponse) => {
			if(!this.messageType.filterMessage(msg)){
				return;
			}
			return listener(this.messageType.unpackMessage(msg), sendResponse);
		}, cancellationToken);
	}
}
class MessagesTargetOfType extends MessagesTarget{
	constructor(messagesTarget, messageType){
		super();
		this.messagesTarget = messagesTarget;
		this.messageType = messageType;
	}
	sendMessage(msg){
		this.messagesTarget.sendMessage(this.messageType.packMessage(msg));
	}
	sendMessageAsync(msg){
		return this.messagesTarget.sendMessageAsync(this.messageType.packMessage(msg));
	}
}

export {EventSource, Event, CancellationToken, MessageType, MessagesSource, MessagesTarget, CombinedEventSource};