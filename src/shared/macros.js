import { navigation } from './navigation';
import { crossBoundaryEventFactory } from './cross-boundary-events';

class Macros{
	constructor(){
		this.navigation = navigation;
		this.rulesForUrlRequest = crossBoundaryEventFactory.create('requestRulesForUrl');
		this.popupOpenedNotification = crossBoundaryEventFactory.create('popupOpened');
		this.emitRulesRequest = crossBoundaryEventFactory.create('emitRulesRequest');
		this.rulesForNavigationNotification = crossBoundaryEventFactory.create('notifyRulesForNavigation');
	}
	getRulesForUrl(url){
		return this.rulesForUrlRequest.target.sendMessageAsync(url);
	}
	onRequestRulesForUrl(listener, cancellationToken){
		return this.rulesForUrlRequest.source.onMessage(listener, cancellationToken);
	}
	notifyRulesForNavigation(rulesForNavigation){
		this.rulesForNavigationNotification.target.sendMessage(rulesForNavigation);
	}
	onNotifyRulesForNavigation(listener, cancellationToken){
		return this.rulesForNavigationNotification.source.onMessage(listener, cancellationToken);
	}
	notifyPopupOpened(){
		this.popupOpenedNotification.target.sendMessage({});
	}
	onNotifyPopupOpened(listener, cancellationToken){
		return this.popupOpenedNotification.source.onMessage(listener, cancellationToken);
	}
	requestToEmitRules(){
		this.emitRulesRequest.activeTabTarget.sendMessage({});
	}
	onRequestToEmitRules(listener, cancellationToken){
		return this.emitRulesRequest.source.onMessage(listener, cancellationToken);
	}
}

var macros = new Macros();

export {macros};