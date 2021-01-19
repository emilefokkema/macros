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
			self.mapAsync(...args).then(mapped => listener(...mapped));
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
	next(cancellationToken){
		return this.when(() => true, cancellationToken)
	}
	dispatch(){
		var args = Array.prototype.slice.apply(arguments);
		for(let listener of this.listeners.slice()){
			listener(...args);
		}
	}
}
class MessageSender extends Event{
	sendMessage(message, responseCallback){
		var responseGiven = false;
		for(let listener of this.listeners){
			listener(message, sendResponse);
		}
		function sendResponse(resp){
			if(responseGiven){
				console.log(`a response was already given, so ignoring`)
				return;
			}
			responseGiven = true;
			if(responseCallback){
				responseCallback(resp);
			}
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
class MessagesSourceAndTarget{
	constructor(){
		var dispatcher = new Event();
		this.source = new EventMessagesSource(dispatcher);
		this.target = new EventMessagesTarget(dispatcher);
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

export {EventSource, Event, CancellationToken, FilteredEventSource, MessageSender, MessageType, MessagesSource, MessagesTarget, MessagesSourceAndTarget};