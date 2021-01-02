import { navigation } from './navigation';
import { crossBoundaryEventFactory } from './cross-boundary-events';


class Macros{
	constructor(){
		this.navigation = navigation;
		this.rulesForUrlRequest = crossBoundaryEventFactory.create('requestRulesForUrl');
		this.numberOfRulesNotification = crossBoundaryEventFactory.create('numberOfRulesNotification');
	}
	getRulesForUrl(url){
		return this.rulesForUrlRequest.target.sendMessageAsync(url);
	}
	onRequestRulesForUrl(listener, cancellationToken){
		return this.rulesForUrlRequest.source.onMessage(listener, cancellationToken);
	}
	notifyNumberOfRules(notification){
		this.numberOfRulesNotification.target.sendMessage(notification);
	}
	onNumberOfRulesNotification(listener, cancellationToken){
		return this.numberOfRulesNotification.source.onMessage(listener, cancellationToken);
	}
}

var macros = new Macros();

export {macros};