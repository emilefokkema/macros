import { macros } from './shared/macros';

var currentlySelectedElement;
var rules = [];
var navigationId;
var url;

var elementSelectedInDevtools = function(element){
	currentlySelectedElement = element;
}

var notify = function(){
	macros.notifyNumberOfRules({
		navigationId: navigationId,
		numberOfRules: rules.length
	});
	macros.notifyRulesForNavigation({
		navigationId: navigationId,
		url: url,
		rules: rules.map(r => ({name: r.name}))
	});
};

var load = async function(){
	url = location.href;
	
	macros.onRequestToEmitRules(() => {
		notify();
	});
	navigationId = await macros.navigation.getId();
	rules = await macros.getRulesForUrl(url);
	console.log(`hello from content script on url ${url} with rules`, rules)
	notify();
};

load();


export {elementSelectedInDevtools};