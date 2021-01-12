import { macros } from './shared/macros';
import { ContentScriptRule } from './content-script-rules';

var currentlySelectedElement;
var rules = [];
var navigationId;
var url;
var loadedPromise;
var loaded = false;

var elementSelectedInDevtools = function(element){
	currentlySelectedElement = element;
}

var notify = async function(){
	if(!loaded){
		await loadedPromise;
	}
	macros.notifyRulesForNavigation({
		navigationId: navigationId,
		url: url,
		rules: rules.map(r => r.getNotification()),
		numberOfRules: rules.length
	});
};

var setRules = function(ruleDefinitions){
	for(var rule of rules){
		rule.dispose();
	}
	rules = ruleDefinitions.map(r => new ContentScriptRule(r));
	if(rules.length > 0){
		console.log(`navigation at ${url} has rules`, rules)
	}
};

var load = async function(){
	url = location.href;
	
	macros.onRequestToEmitRules(() => {
		notify();
	});
	navigationId = await macros.navigation.getId();
	setRules(await macros.getRulesForUrl(url));
	loaded = true;
	notify();
};

loadedPromise = load();


export {elementSelectedInDevtools};