import { macros } from './shared/macros';
import { CancellationToken } from './shared/events';
import { ContentScriptRule, createAction } from './content-script-rules';

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
		numberOfRulesThatHaveSomethingToDo: ruleNotifications.filter(r => r.hasSomethingToDo).length,
		numberOfRulesThatHaveExecuted: ruleNotifications.filter(r => r.hasExecuted).length
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
	navigationId = await macros.navigation.getId();
	setRules(await macros.getRulesForUrl(url));
	macros.onRequestToEmitRules(({navigationIds}) => {
		if(!navigationIds.some(id => navigationId === id)){
			return;
		}
		notify();
	});
	macros.onExecuteRuleRequest(({ruleId, navigationId: _navigationId}, sendResponse) => {
		if(_navigationId !== navigationId){
			return;
		}
		console.log(`navigation '${navigationId}' got request to execute rule:`, ruleId);
		var rule = rules.find(r => r.id === ruleId);
		if(rule){
			rule.execute();
		}
		sendResponse({});
	});
	macros.onExecuteActionRequest(({navigationId: _navigationId, action: actionDefinition}, sendResponse) => {
		if(_navigationId !== navigationId){
			return;
		}
		var action = createAction(actionDefinition);
		action.execute();
		sendResponse({});
	});
	loaded = true;
	notify();
};

loadedPromise = load();


export {elementSelectedInDevtools};