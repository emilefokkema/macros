import { navigation } from './navigation/navigation-interface';
import { crossBoundaryEventFactory } from './cross-boundary-events';
import { editors } from './editors';

class Macros{
	constructor(){
		this.navigation = navigation;
		this.editors = editors;
		this.rulesForUrlRequest = crossBoundaryEventFactory.create('requestRulesForUrl');
		this.popupOpenedNotification = crossBoundaryEventFactory.create('popupOpened');
		this.emitRulesRequest = crossBoundaryEventFactory.create('emitRulesRequest');
		this.rulesForNavigationNotification = crossBoundaryEventFactory.create('notifyRulesForNavigation');
		this.executeRuleMessage = crossBoundaryEventFactory.create('executeRule');
		this.openEditorRequest = crossBoundaryEventFactory.create('openEditor');
		this.ruleByIdRequest = crossBoundaryEventFactory.create('requestRuleById');
		this.executeActionRequest = crossBoundaryEventFactory.create('executeAction');
		this.editedStatusRequest = crossBoundaryEventFactory.create('requestEditedStatus');
		this.editorLoadedMessage = crossBoundaryEventFactory.create('editorLoaded');
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
	getEditedStatusAsync(ruleId){
		return this.editedStatusRequest.target.sendMessageAsync({ruleId});
	}
	onEditedStatusRequest(listener, cancellationToken){
		return this.editedStatusRequest.source.onMessage(listener, cancellationToken);
	}
	onEditorLoaded(listener, cancellationToken){
		return this.editorLoadedMessage.source.onMessageFromNavigation(listener, cancellationToken);
	}
	notifyEditorLoaded(msg){
		this.editorLoadedMessage.target.sendMessage(msg);
	}
}

var macros = new Macros();

export {macros};