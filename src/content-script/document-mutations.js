import { EventSource } from '../shared/events';

class DocumentMutations extends EventSource{
	constructor(attributeNames){
		super();
		this.attributeNames = attributeNames;
		this.observer = new MutationObserver(() => this.notifyListeners());
		this.observing = false;
		this.listeners = [];
	}
	notifyListeners(){
		for(var listener of this.listeners.slice()){
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

export { DocumentMutations };