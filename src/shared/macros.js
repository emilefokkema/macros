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
		this.initializeEditorRequest = crossBoundaryEventFactory.create('initializeEditor');
		this.ruleByIdRequest = crossBoundaryEventFactory.create('requestRuleById');
		this.executeActionRequest = crossBoundaryEventFactory.create('executeAction');
	}
	getRulesForUrl(url){
		return this.rulesForUrlRequest.target.sendMessageAsync(url);
	}
	getRuleById(ruleId){
		return this.ruleByIdRequest.target.sendMessageAsync(ruleId);
	}
	onGetRuleByIdRequest(listener, cancellationToken){
		return this.ruleByIdRequest.source.onMessage(listener, cancellationToken);
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
	requestToEmitRules(msg){
		this.emitRulesRequest.target.sendMessage(msg);
	}
	onRequestToEmitRules(listener, cancellationToken){
		return this.emitRulesRequest.source.onMessage(listener, cancellationToken);
	}
	executeRuleAsync(navigationId, ruleId){
		return this.executeRuleMessage.target.sendMessageAsync({navigationId, ruleId});
	}
	onExecuteRuleRequest(listener, cancellationToken){
		return this.executeRuleMessage.source.onMessage(listener, cancellationToken);
	}
	executeActionAsync(navigationId, action){
		return this.executeActionRequest.target.sendMessageAsync({navigationId, action});
	}
	onExecuteActionRequest(listener, cancellationToken){
		return this.executeActionRequest.source.onMessage(listener, cancellationToken);
	}
	onRequestToOpenEditor(listener, cancellationToken){
		return this.openEditorRequest.source.onMessage(listener, cancellationToken);
	}
	requestToOpenEditor(req){
		this.openEditorRequest.target.sendMessage(req);
	}
	initializeEditor(){
		return this.initializeEditorRequest.target.sendMessageAsync({});
	}
	onRequestToInitializeEditor(listener, cancellationToken){
		return this.initializeEditorRequest.source.onMessage(listener, cancellationToken);
	}
}

var macros = new Macros();

export {macros};