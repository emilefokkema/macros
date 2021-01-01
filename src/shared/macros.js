import { navigation } from './navigation';
import { crossBoundaryEventFactory } from './cross-boundary-events';


class Macros{
	constructor(){
		this.navigation = navigation;
		this.rulesForUrlRequest = crossBoundaryEventFactory.create('requestRulesForUrl');
	}
	getRulesForUrl(url){
		return this.rulesForUrlRequest.target.sendMessageAsync(url);
	}
	onRequestRulesForUrl(listener, cancellationToken){
		return this.rulesForUrlRequest.source.onMessage(listener, cancellationToken);
	}
}

var macros = new Macros();

export {macros};