import { editors } from './editors';

class Macros{
	constructor(navigationInterface, inspectedWindow, crossBoundaryEventFactory){
		this.navigation = navigationInterface;
		this.inspectedWindow = inspectedWindow;
		this.editors = editors;
		this.rulesForUrlRequest = crossBoundaryEventFactory.create('requestRulesForUrl');
		this.emitRulesRequest = crossBoundaryEventFactory.create('emitRulesRequest');
		this.rulesForNavigationNotification = crossBoundaryEventFactory.create('notifyRulesForNavigation');
		this.executeRuleMessage = crossBoundaryEventFactory.create('executeRule');
		this.openEditorRequest = crossBoundaryEventFactory.create('openEditor');
		this.ruleByIdRequest = crossBoundaryEventFactory.create('requestRuleById');
		this.allRulesRequest = crossBoundaryEventFactory.create('requestAllRules');
		this.executeActionRequest = crossBoundaryEventFactory.create('executeAction');
		this.editedStatusRequest = crossBoundaryEventFactory.create('requestEditedStatus');
		this.editorLoadedMessage = crossBoundaryEventFactory.create('editorLoaded');
		this.editedStatusChangedMessage = crossBoundaryEventFactory.create('editedStatusChanged');
		this.saveRuleRequest = crossBoundaryEventFactory.create('requestSaveRule');
		this.deleteRuleRequest = crossBoundaryEventFactory.create('requestDeleteRule');
		this.ruleAddedNotification = crossBoundaryEventFactory.create('notifyRuleAdded');
		this.ruleDeletedNotification = crossBoundaryEventFactory.create('notifyRuleDeleted');
		this.ruleUpdatedNotification = crossBoundaryEventFactory.create('notifyRuleUpdated');
		this.addActionForSelectorRequest = crossBoundaryEventFactory.create('requestToAddActionForSelector');
		this.crossBoundaryEventFactory = crossBoundaryEventFactory;
	}
	forBackground(){
		this.crossBoundaryEventFactory.manageSubscriptions();
	}
	getRulesForUrl(url){
		return this.rulesForUrlRequest.target.sendMessageAsync(url);
	}
	getRuleById(ruleId){
		return this.ruleByIdRequest.target.sendMessageAsync(ruleId);
	}
	getAllRules(){
		return this.allRulesRequest.target.sendMessageAsync({});
	}
	onGetRuleByIdRequest(listener, cancellationToken){
		return this.ruleByIdRequest.source.onMessage(listener, cancellationToken);
	}
	onGetAllRulesRequest(listener, cancellationToken){
		return this.allRulesRequest.source.onMessage(listener, cancellationToken);
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
	async requestToOpenEditor({navigationId, ruleId}){
		var alreadyOpen = await this.openEditorRequest.target.sendMessageAsync({navigationId, ruleId});
		if(alreadyOpen){
			return;
		}
		await new Promise((resolve) => {
			this.editedStatusChangedMessage.source.onMessage(({ruleId: _ruleId, otherNavigationId, edited}) => {
				if(edited && (ruleId !== undefined && _ruleId === ruleId || otherNavigationId === navigationId)){
					resolve();
				}
			});
		});
	}
	openManagementPage(){
		this.navigation.openTab('management.html')
	}
	getEditedStatusAsync(ruleId){
		return this.editedStatusRequest.target.sendMessageAsync({ruleId});
	}
	onEditedStatusChanged(listener, cancellationToken){
		return this.editedStatusChangedMessage.source.onMessage(listener, cancellationToken);
	}
	notifyEditedStatusChanged(msg){
		this.editedStatusChangedMessage.target.sendMessage(msg);
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
	saveRuleAsync(rule){
		return this.saveRuleRequest.target.sendMessageAsync(rule);
	}
	onSaveRuleRequest(listener, cancellationToken){
		return this.saveRuleRequest.source.onMessage(listener, cancellationToken);
	}
	deleteRuleAsync(ruleId){
		return this.deleteRuleRequest.target.sendMessageAsync(ruleId);
	}
	onDeleteRuleRequest(listener, cancellationToken){
		return this.deleteRuleRequest.source.onMessage(listener, cancellationToken);
	}
	notifyRuleAdded(){
		this.ruleAddedNotification.target.sendMessage({});
	}
	onRuleAdded(listener, cancellationToken){
		return this.ruleAddedNotification.source.onMessage(listener, cancellationToken);
	}
	notifyRuleDeleted(msg){
		this.ruleDeletedNotification.target.sendMessage(msg);
	}
	onRuleDeleted(listener, cancellationToken){
		return this.ruleDeletedNotification.source.onMessage(listener, cancellationToken);
	}
	notifyRuleUpdated(msg){
		this.ruleUpdatedNotification.target.sendMessage(msg);
	}
	onRuleUpdated(listener, cancellationToken){
		return this.ruleUpdatedNotification.source.onMessage(listener, cancellationToken);
	}
	requestToAddActionForSelector(req){
		this.addActionForSelectorRequest.target.sendMessage(req);
	}
	onRequestToAddActionForSelector(listener, cancellationToken){
		this.addActionForSelectorRequest.source.onMessage(listener, cancellationToken);
	}
}

export { Macros }