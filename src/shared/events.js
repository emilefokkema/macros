import { PromiseResolver } from './promise-resolver';

class EventSource {
	listen(listener){
		this.addListener(listener);
		return {
			cancel: () => {
				this.removeListener(listener)
			}
		};
	}
	filter(filter){
		return new FilteredEventSourceWithDelegate(this, filter);
	}
	map(map){
		return new MappedEventSourceWithDelegate(this, map);
	}
	when(predicate, cancellationToken){
		var resolve;
		var promise = new Promise((res) => {resolve = res;});
		var listener = this.listen(function(){
			if(predicate.apply(null, arguments)){
				listener.cancel();
				resolve();
			}
		});
		if(cancellationToken){
			cancellationToken.onCancelled(() => listener.cancel());
		}
		return promise;
	}
}
class MappedEventSource extends EventSource{
	constructor(eventSource){
		super();
		this.eventSource = eventSource;
	}
	listen(listener){
		var self = this;
		return this.eventSource.listen(function(){
			var args = Array.prototype.slice.apply(arguments);
			var mapped = self.map(...args);
			return listener(...mapped);
		});
	}
}
class FilteredEventSource extends EventSource{
	constructor(eventSource){
		super();
		this.eventSource = eventSource;
	}
	listen(listener){
		var self = this;
		return this.eventSource.listen(function(){
			var args = Array.prototype.slice.apply(arguments);
			if(!self.filter(...args)){
				return;
			}

			return listener(...args);
		});
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
	dispatch(event){
		for(let listener of this.listeners){
			listener(event);
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
	onMessage(listener){
		return {cancel(){}};
	}
	nextMessage(){
		var resolver = new PromiseResolver();
		var listener = this.onMessage((msg) => {
			listener.cancel();
			resolver.resolve(msg);
		});
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
class MessagesSourceOfType extends MessagesSource{
	constructor(messagesSource, messageType){
		super();
		this.messagesSource = messagesSource;
		this.messageType = messageType;
	}
	onMessage(listener){
		return this.messagesSource.onMessage((msg, sendResponse) => {
			if(!this.messageType.filterMessage(msg)){
				return;
			}
			return listener(this.messageType.unpackMessage(msg), sendResponse);
		});
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

export {EventSource, Event, CancellationToken, FilteredEventSource, MessageSender, MessageType, MessagesSource, MessagesTarget};