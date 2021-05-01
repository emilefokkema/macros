import { Macros } from '../shared/macros-class';
import { RuleCollection } from './rules';
import { ButtonCollection } from './button';
import { EditorCollection } from './editor-collection';

async function tryExecuteContentScript(navigation){
	if(navigation.url === 'about:blank'){
		console.log('url is about:blank, not loading content script');
		return;
	}
	try{
		await navigation.executeScriptAsync('content-script.js');
	}catch(e){
		console.log(`could not execute content script for navigation at ${navigation.url}: `, e);
	}
}

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

        setPopup('popup.html');

        navigationInterface.onDisappeared(() => {
            editorCollection.prune();
            buttons.prune();
        });
        navigationInterface.onCreated(navigation => {
            tryExecuteContentScript(navigation);
        });
        macros.onRequestRulesForUrl((url, sendResponse) => {
            rules.getRulesForUrl(url).then(sendResponse);
            return true;
        });
        macros.onNotifyRulesForNavigation(notification => {
            buttons.addNotification(notification);
        });
        macros.onRequestToOpenEditor((req, sendResponse) => {
            editorCollection.openEditor(req).then((alreadyOpen) => {
                sendResponse(alreadyOpen);
            });
            return true;
        });
        macros.onEditedStatusRequest(({ruleId}, sendResponse) => {
            editorCollection.getEditedStatus(ruleId).then(st => sendResponse(st));
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
        
        rules.ruleAdded.listen(() => {
            macros.notifyRuleAdded();
        });
        rules.ruleDeleted.listen((msg) => {
            macros.notifyRuleDeleted(msg);
        });
        rules.ruleUpdated.listen((msg) => {
            macros.notifyRuleUpdated(msg);
        });
        editorCollection.editedStatusChanged.listen(({ruleId, otherNavigationId, edited}) => {
            macros.notifyEditedStatusChanged({ruleId, otherNavigationId, edited});
        });
}