import { macros } from './shared/macros';
import { CancellationToken } from './shared/events';
import { ContentScriptRule } from './content-script-rules';

var currentlySelectedElement;
var rules = [];
var navigationId;
var url;
var loadedPromise;
var loaded = false;
var cancellationToken;

var elementSelectedInDevtools = function(element){
	currentlySelectedElement = element;
}

var notify = async function(){
	if(!loaded){
		await loadedPromise;
	}
	var ruleNotifications = rules.map(r => r.getNotification());
	macros.notifyRulesForNavigation({
		navigationId: navigationId,
		url: url,
		rules: ruleNotifications,
		numberOfRules: ruleNotifications.length,
		numberOfRulesThatHaveSomethingToDo: ruleNotifications.filter(r => r.hasSomethingToDo).length
	});
};

var setRules = function(ruleDefinitions){
	if(cancellationToken){
		cancellationToken.cancel();
	}
	cancellationToken = new CancellationToken();
	for(var rule of rules){
		rule.dispose();
	}
	rules = ruleDefinitions.map(r => {
		var rule = new ContentScriptRule(r);
		rule.hasSomethingToDoChanged.listen(() => notify(), cancellationToken);
		return rule;
	});
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