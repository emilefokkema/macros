import { macros } from './shared/macros';
import { rules } from './rules-new';
import { buttons } from './shared/button';
import { editorCollection } from './editor-collection';
import { setPopup } from './shared/set-popup';

macros.forBackground();

setPopup('popup.html')

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

macros.navigation.onCreated(navigation => {
	tryExecuteContentScript(navigation);
});
macros.onRequestRulesForUrl((url, sendResponse) => {
	sendResponse(rules.getRulesForUrl(url));
});
macros.onNotifyRulesForNavigation(notification => {
	buttons.addNotification(notification);
});
macros.onNotifyPopupOpened(async () => {
	var navigationsOnPopupTab = await macros.navigation.getAllForPopupTab();
	macros.requestToEmitRules({navigationIds: navigationsOnPopupTab.map(n => n.id)});
});
macros.onRequestToOpenEditor((req) => {
	editorCollection.openEditor(req);
});
macros.onEditedStatusRequest(({ruleId}, sendResponse) => {
	editorCollection.getEditedStatus(ruleId).then(st => sendResponse(st));
	return true;
});
macros.onGetRuleByIdRequest((ruleId, sendResponse) => {
	sendResponse(rules.getRule(ruleId));
});
macros.onGetAllRulesRequest((_, sendResponse) => {
	sendResponse(rules.getAll());
});
macros.onSaveRuleRequest((rule, sendResponse) => {
	sendResponse(rules.saveRule(rule));
});
macros.onDeleteRuleRequest((ruleId, sendResponse) => {
	rules.deleteRule(ruleId);
	sendResponse({});
});
macros.onEditorLoaded(({ruleId, otherNavigationId}, navigation) => {
	editorCollection.addOpenedEditor(ruleId, navigation, otherNavigationId);
});

rules.ruleAdded.listen(() => {
	macros.notifyRuleAdded();
});