import { macros } from './shared/macros';
import { rules } from './rules-new';
import { buttons } from './shared/button';
import { editors } from './editors';
import { setPopup } from './shared/set-popup';
import { navigationMessagesEventSource } from './shared/navigation';

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
	editors.openEditor(req);
});
macros.onEditedStatusRequest(({ruleId}, sendResponse) => {
	editors.getEditedStatus(ruleId).then(st => sendResponse(st));
	return true;
});
macros.onGetRuleByIdRequest((ruleId, sendResponse) => {
	sendResponse(rules.getRule(ruleId));
});
macros.onEditorLoaded(({ruleId, otherNavigationId}, navigation) => {
	console.log(`editor loaded for ruleId ${ruleId} and otherNavigationId ${otherNavigationId} at navigation`, navigation)
});