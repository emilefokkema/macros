class EventSource{
	listen(listener){
		this.addListener(listener);
		return {
			cancel: () => {
				this.removeListener(listener)
			}
		};
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
class FilteredEventSource extends EventSource{
	constructor(eventSource){
		super();
		this.eventSource = eventSource;
	}
	listen(listener){
		var self = this;
		return this.eventSource.listen(function(){
			var args = Array.prototype.slice.apply(arguments);
			if(!self.filter.apply(self, args)){
				return;
			}
			return listener.apply(null, args);
		});
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

export {EventSource, Event, CancellationToken, FilteredEventSource};