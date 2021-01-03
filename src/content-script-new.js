import { macros } from './shared/macros';

var currentlySelectedElement;

var elementSelectedInDevtools = function(element){
	currentlySelectedElement = element;
}

var load = async function(){
	var url = location.href;
	var navigationId = await macros.navigation.getId();
	console.log(`hello from content script on url ${url} with id ${navigationId}`)
	var rules = await macros.getRulesForUrl(url);
	console.log(`hello from content script on url ${url} with rules`, rules)
	if(rules.length > 0){
		macros.notifyNumberOfRules({
			navigationId: navigationId,
			numberOfRules: rules.length
		});
	}
};

load();


export {elementSelectedInDevtools};