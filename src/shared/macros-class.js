import { editors } from './editors';
import { ruleDefinitions } from './rule-definitions';

class Macros{
	constructor(navigationInterface, inspectedWindow, messageBus, pageInterface){
		this.navigation = navigationInterface;
		this.inspectedWindow = inspectedWindow;
		this.editors = editors;
		this.ruleDefinitions = ruleDefinitions;
		this.page = pageInterface;
		this.rulesForUrlRequest = messageBus.createChannel('requestRulesForUrl');
		this.rulesForDownloadRequest = messageBus.createChannel('requestRulesForDownload');
		this.urlWithEncodedRuleRequest = messageBus.createChannel('urlWithEncodedRuleRequest');
		this.rulesJsonUploadRequest = messageBus.createChannel('uploadRulesJson');
		this.rulesForNavigationNotification = messageBus.createChannel('notifyRulesForNavigation');
		this.executeRuleMessage = messageBus.createChannel('executeRule');
		this.openEditorRequest = messageBus.createChannel('openEditor');
		this.ruleByIdRequest = messageBus.createChannel('requestRuleById');
		this.allRulesRequest = messageBus.createChannel('requestAllRules');
		this.executeActionRequest = messageBus.createChannel('executeAction');
		this.editedStatusRequest = messageBus.createChannel('requestEditedStatus');
		this.editableStatusRequest = messageBus.createChannel('requestEditableStatus');
		this.editorLoadedMessage = messageBus.createChannel('editorLoaded');
		this.editedStatusChangedMessage = messageBus.createChannel('editedStatusChanged');
		this.saveRuleRequest = messageBus.createChannel('requestSaveRule');
		this.deleteRuleRequest = messageBus.createChannel('requestDeleteRule');
		this.ruleAddedNotification = messageBus.createChannel('notifyRuleAdded');
		this.ruleDeletedNotification = messageBus.createChannel('notifyRuleDeleted');
		this.ruleUpdatedNotification = messageBus.createChannel('notifyRuleUpdated');
		this.addActionRequest = messageBus.createChannel('requestToAddAction');
		this.addSelectActionRequest = messageBus.createChannel('requestToAddSelectAction');
		this.addSelectActionToEditorRequest = messageBus.createChannel('requestToAddSelectActionToEditor');
		this.getSelectedElementInDevtoolsRequest = messageBus.createChannel('getSelectedElementInDevtoolsRequest');
		this.selectedElementInDevtoolsNotification = messageBus.createChannel('selectedElementInDevtoolsNotification');
		this.suggestionIndicationStartNotification = messageBus.createChannel('suggestionIndicationStart');
		this.suggestionIndicationEndNotification = messageBus.createChannel('suggestionIndicationEnd');
		this.executeSuggestionRequest = messageBus.createChannel('executeSuggestion');
		this.markSuggestionAsRemovedRequest = messageBus.createChannel('markSuggestionAsRemoved');
		this.undoSuggestionRequest = messageBus.createChannel('undoSuggestion');
		this.addSuggestionToRuleRequest = messageBus.createChannel('addSuggestionToRuleRequest');
		this.addSuggestionToNewRuleRequest = messageBus.createChannel('addSuggestionToNewRuleRequest');
		this.getAndRemoveSuggestionRequest = messageBus.createChannel('getAndRemoveSuggestion');
		this.getRuleStatesForNavigationRequest = messageBus.createChannel('getRuleStatesForNavigation');
		this.ruleStateForNavigationChangeNotification = messageBus.createChannel('ruleStateForNavigationChangeNotification');
		this.ruleStateForNavigationRemovedNotification = messageBus.createChannel('ruleStateForNavigationRemovedNotification');
		this.getSuggestionsRequest = messageBus.createChannel('getSuggestions');
		this.reloadSuggestionsRequest = messageBus.createChannel('reloadSuggestions');
		this.newDraftRuleForNavigationRequest = messageBus.createChannel('newDraftRuleForNavigationRequest');
		this.draftRuleCreatedNotification = messageBus.createChannel('draftRuleCreatedNotification');
		this.draftRulesRemovedNotification = messageBus.createChannel('draftRulesRemovedNotification');
		this.draftRuleForNavigationRequest = messageBus.createChannel('draftRuleForNavigationRequest');
		this.draftRuleStateForNavigationRequest = messageBus.createChannel('draftRuleStateForNavigationRequest');
		this.draftRuleStateForNavigationNotification = messageBus.createChannel('draftRuleStateForNavigationNotification');
		this.draftRuleChangedNotification = messageBus.createChannel('draftRuleChangedNotification');
		this.executeDraftRuleRequest = messageBus.createChannel('executeDraftRuleRequest');
	}
	getRulesForUrl(url){
		return this.rulesForUrlRequest.target.sendMessageAsync(url);
	}
	getRuleById(ruleId){
		return this.ruleByIdRequest.target.sendMessageAsync(ruleId);
	}
	getRulesForDownload(ruleIds){
		return this.rulesForDownloadRequest.target.sendMessageAsync({ruleIds});
	}
	onGetRulesForDownloadRequest(listener, cancellationToken){
		return this.rulesForDownloadRequest.source.onMessage(listener, cancellationToken);
	}
	getUrlWithEncodedRule(ruleId, navigationId){
		return this.urlWithEncodedRuleRequest.target.sendMessageAsync({ruleId, navigationId})
	}
	onUrlWithEncodedRuleRequest(listener, cancellationToken){
		return this.urlWithEncodedRuleRequest.source.onMessage(listener, cancellationToken);
	}
	uploadRulesJson(jsonString){
		return this.rulesJsonUploadRequest.target.sendMessageAsync({jsonString});
	}
	onUploadRulesJson(listener, cancellationToken){
		return this.rulesJsonUploadRequest.source.onMessage(listener, cancellationToken);
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
	requestToOpenEditor({navigationId, ruleId}){
		return this.openEditorRequest.target.sendMessageAsync({navigationId, ruleId});
	}
	openManagementPage(){
		var searchParams = new URLSearchParams();
		searchParams.append('page', 'management.html')
		this.navigation.openTab(`sandbox.html?${searchParams}`);
	}
	getEditableStatus(ruleId, navigationId){
		return this.editableStatusRequest.target.sendMessageAsync({ruleId, navigationId})
	}
	onGetEditableStatusRequest(listener, cancellationToken){
		return this.editableStatusRequest.source.onMessage(listener, cancellationToken);
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
	requestToAddAction(req){
		this.addActionRequest.target.sendMessage(req);
	}
	onRequestToAddAction(listener, cancellationToken){
		return this.addActionRequest.source.onMessage(listener, cancellationToken);
	}
	addSelectAction(navigationId, selectorText, ruleId){
		this.addSelectActionRequest.target.sendMessage({navigationId, selectorText, ruleId});
	}
	onRequestToAddSelectAction(listener, cancellationToken){
		return this.addSelectActionRequest.source.onMessage(listener, cancellationToken);
	}
	addSelectActionToEditor(navigationId, ruleId, selectorText){
		this.addSelectActionToEditorRequest.target.sendMessage({navigationId, ruleId, selectorText});
	}
	onRequestToAddSelectActionToEditor(listener, cancellationToken){
		return this.addSelectActionToEditorRequest.source.onMessage(listener, cancellationToken);
	}
	getSelectedElementInDevtools(tabId){
		return this.getSelectedElementInDevtoolsRequest.target.sendMessageAsync({tabId});
	}
	onGetSelectedElementInDevtoolsRequest(listener, cancellationToken){
		return this.getSelectedElementInDevtoolsRequest.source.onMessage(listener, cancellationToken);
	}
	notifySelectedElementInDevtools(element){
		this.selectedElementInDevtoolsNotification.target.sendMessage(element)
	}
	onSelectedElementInDevtoolsChange(listener, cancellationToken){
		return this.selectedElementInDevtoolsNotification.source.onMessage(listener, cancellationToken);
	}
	notifySuggestionIndicationStart(navigationId, suggestionId){
		this.suggestionIndicationStartNotification.target.sendMessage({navigationId, suggestionId});
	}
	onNotifySuggestionIndicationStart(listener, cancellationToken){
		return this.suggestionIndicationStartNotification.source.onMessage(listener, cancellationToken);
	}
	notifySuggestionIndicationEnd(navigationId, suggestionId){
		this.suggestionIndicationEndNotification.target.sendMessage({navigationId, suggestionId});
	}
	onNotifySuggestionIndicationEnd(listener, cancellationToken){
		return this.suggestionIndicationEndNotification.source.onMessage(listener, cancellationToken);
	}
	onExecuteSuggestionRequest(listener, cancellationToken){
		return this.executeSuggestionRequest.source.onMessage(listener, cancellationToken);
	}
	executeSuggestion(navigationId, suggestionId){
		return this.executeSuggestionRequest.target.sendMessageAsync({suggestionId, navigationId});
	}
	markSuggestionAsRemoved(navigationId, suggestionId){
		return this.markSuggestionAsRemovedRequest.target.sendMessageAsync({navigationId, suggestionId});
	}
	onMarkSuggestionAsRemoved(listener, cancellationToken){
		return this.markSuggestionAsRemovedRequest.source.onMessage(listener, cancellationToken);
	}
	onUndoSuggestionRequest(listener, cancellationToken){
		return this.undoSuggestionRequest.source.onMessage(listener, cancellationToken);
	}
	undoSuggestion(navigationId, suggestionId){
		return this.undoSuggestionRequest.target.sendMessageAsync({suggestionId, navigationId});
	}
	onAddSuggestionToRuleRequest(listener, cancellationToken){
		return this.addSuggestionToRuleRequest.source.onMessage(listener, cancellationToken);
	}
	requestToAddSuggestionToRule(ruleId, navigationId, suggestionId){
		this.addSuggestionToRuleRequest.target.sendMessage({ruleId, navigationId, suggestionId});
	}
	onAddSuggestionToNewRuleRequest(listener, cancellationToken){
		return this.addSuggestionToNewRuleRequest.source.onMessage(listener, cancellationToken);
	}
	requestToAddSuggestionToNewRule(navigationId, suggestionId){
		this.addSuggestionToNewRuleRequest.target.sendMessage({navigationId, suggestionId});
	}
	onGetAndRemoveSuggestionRequest(listener, cancellationToken){
		return this.getAndRemoveSuggestionRequest.source.onMessage(listener, cancellationToken);
	}
	getSuggestions(navigationId){
		return this.getSuggestionsRequest.target.sendMessageAsync({navigationId});
	}
	onGetSuggestionsRequest(listener, cancellationToken){
		return this.getSuggestionsRequest.source.onMessage(listener, cancellationToken);
	}
	reloadSuggestions(navigationId){
		return this.reloadSuggestionsRequest.target.sendMessageAsync({navigationId});
	}
	onReloadSuggestionsRequest(listener, cancellationToken){
		return this.reloadSuggestionsRequest.source.onMessage(listener, cancellationToken);
	}
	getAndRemoveSuggestion(suggestionId, navigationId){
		return this.getAndRemoveSuggestionRequest.target.sendMessageAsync({suggestionId, navigationId});
	}
	getRuleStatesForNavigation(navigationId){
		return this.getRuleStatesForNavigationRequest.target.sendMessageAsync({navigationId});
	}
	onGetRuleStatesForNavigation(listener, cancellationToken){
		return this.getRuleStatesForNavigationRequest.source.onMessage(listener, cancellationToken);
	}
	notifyRuleStateForNavigationChanged(navigationId, state){
		this.ruleStateForNavigationChangeNotification.target.sendMessage({navigationId, state});
	}
	onRuleStateForNavigationChanged(listener, cancellationToken){
		return this.ruleStateForNavigationChangeNotification.source.onMessage(listener, cancellationToken);
	}
	notifyRuleStateForNavigationRemoved(navigationId, ruleId){
		this.ruleStateForNavigationRemovedNotification.target.sendMessage({navigationId, ruleId});
	}
	onRuleStateForNavigationRemoved(listener, cancellationToken){
		return this.ruleStateForNavigationRemovedNotification.source.onMessage(listener, cancellationToken);
	}
	createNewDraftRuleForNavigation(navigationId){
		return this.newDraftRuleForNavigationRequest.target.sendMessageAsync({navigationId});
	}
	onRequestToCreateNewDraftRuleForNavigation(listener, cancellationToken){
		return this.newDraftRuleForNavigationRequest.source.onMessage(listener, cancellationToken);
	}
	getDraftRuleForNavigation(navigationId){
		return this.draftRuleForNavigationRequest.target.sendMessageAsync({navigationId});
	}
	onRequestDraftRuleForNavigation(listener, cancellationToken){
		return this.draftRuleForNavigationRequest.source.onMessage(listener, cancellationToken);
	}
	notifyDraftRuleCreated(navigationId, draftRule){
		this.draftRuleCreatedNotification.target.sendMessage({navigationId, draftRule});
	}
	onDraftRuleCreated(listener, cancellationToken){
		return this.draftRuleCreatedNotification.source.onMessage(listener, cancellationToken);
	}
	notifyDraftRulesRemoved(navigationIds){
		this.draftRulesRemovedNotification.target.sendMessage(navigationIds)
	}
	onDraftRulesRemoved(listener, cancellationToken){
		return this.draftRulesRemovedNotification.source.onMessage(listener, cancellationToken);
	}
	getDraftRuleStateForNavigation(navigationId){
		return this.draftRuleStateForNavigationRequest.target.sendMessageAsync({navigationId});
	}
	onDraftRuleStateForNavigationRequest(listener, cancellationToken){
		return this.draftRuleStateForNavigationRequest.source.onMessage(listener, cancellationToken);
	}
	notifyDraftRuleStateForNavigation(navigationId, draftRuleState){
		this.draftRuleStateForNavigationNotification.target.sendMessage({navigationId, draftRuleState});
	}
	onDraftRuleStateForNavigation(listener, cancellationToken){
		return this.draftRuleStateForNavigationNotification.source.onMessage(listener, cancellationToken);
	}
	onRequestToExecuteDraftRule(listener, cancellationToken){
		return this.executeDraftRuleRequest.source.onMessage(listener, cancellationToken);
	}
	executeDraftRule(navigationId){
		return this.executeDraftRuleRequest.target.sendMessageAsync({navigationId});
	}
	onDraftRuleChanged(listener, cancellationToken){
		return this.draftRuleChangedNotification.source.onMessage(listener, cancellationToken);
	}
	notifyDraftRuleChanged(navigationId, draftRule){
		this.draftRuleChangedNotification.target.sendMessage({navigationId, draftRule});
	}
}

export { Macros }
