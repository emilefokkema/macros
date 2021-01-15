import { navigation } from './navigation';
import { crossBoundaryEventFactory } from './cross-boundary-events';

class Macros{
	constructor(){
		this.navigation = navigation;
		this.rulesForUrlRequest = crossBoundaryEventFactory.create('requestRulesForUrl');
		this.popupOpenedNotification = crossBoundaryEventFactory.create('popupOpened');
		this.emitRulesRequest = crossBoundaryEventFactory.create('emitRulesRequest');
		this.rulesForNavigationNotification = crossBoundaryEventFactory.create('notifyRulesForNavigation');
		this.executeRuleMessage = crossBoundaryEventFactory.create('executeRule');
		this.openEditorRequest = crossBoundaryEventFactory.create('openEditor');
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
		this.emitRulesRequest.currentTabTarget.sendMessage({});
	}
	onRequestToEmitRules(listener, cancellationToken){
		return this.emitRulesRequest.source.onMessage(listener, cancellationToken);
	}
	async executeRuleAsync(navigationId, ruleId){
		var navigation = await this.navigation.getNavigation(navigationId);
		if(!navigation){
			throw new Error(`cound not find navigation '${navigationId}'`)
		}
		await this.executeRuleMessage.getTargetForNavigation(navigation).sendMessageAsync({ruleId});
	}
	onExecuteRuleRequest(navigationId, listener, cancellationToken){
		return this.executeRuleMessage.getSourceForNavigation(navigationId).onMessage(listener, cancellationToken);
	}
	onRequestToOpenEditor(listener, cancellationToken){
		return this.openEditorRequest.source.onMessage(listener, cancellationToken);
	}
	requestToOpenEditor(req){
		this.openEditorRequest.target.sendMessage(req);
	}
}

var macros = new Macros();

export {macros};