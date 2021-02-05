import { EventSource } from './shared/events';

class DocumentMutationListener{
	constructor(attributeNames, notify){
		this.attributeNames = attributeNames;
		this.notify = notify;
	}
}

class OtherDocumentMutations extends EventSource{
	constructor(attributeNames){
		super();
		this.attributeNames = attributeNames;
		this.observer = new MutationObserver(() => this.notifyListeners());
		this.observing = false;
	}
	notifyListeners(){
		for(var listener of this.listeners){
			listener();
		}
	}
	removeListener(listener){
		var index = this.listeners.indexOf(listener);
		if(index === -1){
			return;
		}
		this.listeners.splice(index, 1);
		if(this.listeners.length > 0){
			return;
		}
		this.observer.disconnect();
		this.observing = false;
	}
	addListener(listener){
		this.listeners.push(listener);
		if(!this.observing){
			this.observer.observe(document, {
				childList: true,
				subtree: true,
				attributeFilter: this.attributeNames
			});
			this.observing = true;
		}
	}
}

class DocumentMutations{
	constructor(){
		this.listeners = [];
		this.observer = new MutationObserver(() => this.notifyListeners());
	}
	notifyListeners(){
		for(var listener of this.listeners){
			listener.notify();
		}
	}
	removeListener(listener){
		var index = this.listeners.indexOf(listener);
		if(index > -1){
			this.listeners.splice(index, 1);
			this.updateObserver();
		}
	}
	addListener(listener){
		this.listeners.push(listener);
		this.updateObserver();
	}
	updateObserver(){
		this.observer.disconnect();
		if(this.listeners.length === 0){
			return;
		}
		var attributeNames = this.listeners.map(l => l.attributeNames).reduce((a, b) => a.concat(b.filter(n => !a.some(nn => nn === n))), []);
		this.observer.observe(document, {
			childList: true,
			subtree: true,
			attributeFilter: attributeNames
		});
	}
	listen(attributeNames, listener, cancellationToken){
		var newListener = new DocumentMutationListener(attributeNames, listener);
		this.addListener(newListener);
		if(cancellationToken){
			cancellationToken.onCancelled(() => this.removeListener(newListener));
		}
		return {
			cancel: () => this.removeListener(newListener)
		};
	}
}

var documentMutations = new DocumentMutations();

export { documentMutations, OtherDocumentMutations };