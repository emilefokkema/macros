import { tabs } from './tabs';
import { crossBoundaryEventFactory } from './cross-boundary-events';


class Macros{
	constructor(){
		this.tabs = tabs;
		this.notifyContentScriptForUrlMessage = crossBoundaryEventFactory.create('notifyContentScriptForUrl');
	}
	notifyContentScriptForUrl(url){
		this.notifyContentScriptForUrlMessage.target.sendMessage(url);
	}
	onNotifyContentScriptForUrl(listener, cancellationToken){
		return this.notifyContentScriptForUrlMessage.source.onMessage(listener, cancellationToken);
	}
}

var macros = new Macros();

export {macros};