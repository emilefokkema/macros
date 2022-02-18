import { Macros } from '../shared/macros-class';
import { RuleCollection } from './rules';
import { ButtonCollection } from './button';
import { EditorCollection } from './editor-collection';

export function backgroundScript(
    setPopup,
    storage,
    buttonInteraction,
    navigationInterface,
    messageBus){
        var macros = new Macros(navigationInterface, undefined, messageBus);
        var rules = new RuleCollection(storage);
        var editorCollection = new EditorCollection(navigationInterface, storage);
        var buttons = new ButtonCollection(navigationInterface, storage, buttonInteraction);

        setPopup('sandbox.html?page=popup.html');

        navigationInterface.onDisappeared(async () => {
            await editorCollection.prune();
            const navigationIdsWithDraftRule = await editorCollection.getNavigationsWithDraftRule();
            await rules.pruneDraftRules(navigationIdsWithDraftRule);
            await buttons.prune();
        });
        macros.onRequestRulesForUrl((url, sendResponse) => {
            rules.getRulesForUrl(url).then(sendResponse);
            return true;
        });
        macros.onNotifyRulesForNavigation(notification => {
            buttons.addNotification(notification);
        });
        macros.onRequestToOpenEditor((req, sendResponse) => {
            editorCollection.openEditor(req).then(() => {
                sendResponse({});
            });
            return true;
        });
        macros.onEditedStatusRequest(({ruleId}, sendResponse) => {
            editorCollection.getEditedStatus(ruleId).then(st => sendResponse(st));
            return true;
        });
        macros.onGetEditableStatusRequest(({ruleId, navigationId}, sendResponse) => {
            editorCollection.getEditableStatus(ruleId, navigationId).then(sendResponse);
            return true;
        });
        macros.onGetRuleByIdRequest((ruleId, sendResponse) => {
            rules.getRule(ruleId).then(sendResponse);
            return true;
        });
        macros.onGetAllRulesRequest((_, sendResponse) => {
            rules.getAll().then(sendResponse);
            return true;
        });
        macros.onSaveRuleRequest((rule, sendResponse) => {
            rules.saveRule(rule).then(sendResponse);
            return true;
        });
        macros.onDeleteRuleRequest((ruleId, sendResponse) => {
            rules.deleteRule(ruleId).then(sendResponse);
            return true;
        });
        macros.onEditorLoaded(({ruleId, otherNavigationId}, navigation) => {
            editorCollection.addOpenedEditor(ruleId, navigation, otherNavigationId);
        });
        macros.onAddSuggestionToNewRuleRequest(async ({navigationId, suggestionId}) => {
            const suggestion = await macros.getAndRemoveSuggestion(suggestionId, navigationId);
            await editorCollection.ensureEditorOpen(navigationId);
            macros.requestToAddAction({navigationId, actionDefinition: suggestion.actionDefinition});
        });
        macros.onRequestToAddSelectAction(async ({navigationId, selectorText, ruleId}) => {
            await editorCollection.openEditor({navigationId, ruleId});
            macros.addSelectActionToEditor(navigationId, ruleId, selectorText);
        });
        macros.onAddSuggestionToRuleRequest(async ({ruleId, navigationId, suggestionId}) => {
            const suggestion = await macros.getAndRemoveSuggestion(suggestionId, navigationId);
            const rule = await rules.getRule(ruleId);
            rule.actions.push(suggestion.actionDefinition);
            rules.saveRule(rule);
        });
        macros.onRequestToCreateNewDraftRuleForNavigation(({navigationId}, sendResponse) => { 
            navigationInterface.getNavigation(navigationId).then(navigation => {
                if(!navigation){
                    sendResponse({});
                }else{
                    rules.createDraftRuleForNavigation(navigation).then((result) => {
                        sendResponse(result);
                        macros.notifyDraftRuleCreated(navigationId, result);
                    })
                }
            });
            return true;
        });
        macros.onRequestDraftRuleForNavigation(({navigationId}, sendResponse) => {
            rules.getDraftRuleForNavigation(navigationId).then((draftRule) => {
                sendResponse(draftRule);
            });
            return true;
        });
        macros.onDraftRuleChanged(({navigationId, draftRule}) => {
            rules.updateDraftRuleForNavigation(navigationId, draftRule)
        });
        
        rules.ruleAdded.listen(() => {
            macros.notifyRuleAdded();
        });
        rules.ruleDeleted.listen((msg) => {
            macros.notifyRuleDeleted(msg);
        });
        rules.ruleUpdated.listen((msg) => {
            macros.notifyRuleUpdated(msg);
        });
        rules.draftRulesRemoved.listen((navigationIds) => {
            macros.notifyDraftRulesRemoved(navigationIds);
        });
        editorCollection.editedStatusChanged.listen(({ruleId, otherNavigationId, edited}) => {
            macros.notifyEditedStatusChanged({ruleId, otherNavigationId, edited});
        });
}