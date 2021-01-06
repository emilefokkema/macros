import { macros } from './shared/macros';
import { rules } from './rules-new';
import { buttons } from './shared/button';

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

macros.navigation.getAll().then(all => all.map(navigation => tryExecuteContentScript(navigation)));
macros.navigation.onCreated(navigation => {
	tryExecuteContentScript(navigation);
});
macros.onRequestRulesForUrl((url, sendResponse) => {
	sendResponse(rules.getRulesForUrl(url));
});
macros.onNumberOfRulesNotification(notification => {
	buttons.addNotification(notification);
});