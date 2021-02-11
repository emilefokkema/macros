import { macros } from './shared/macros';
import { ContentScriptRuleCollection, createAction } from './content-script-rules';
import { Selector } from './shared/selector';

var currentlySelectedElement;
var navigationId;
var url;
var loadedPromise;
var loaded = false;



var ruleCollection = new ContentScriptRuleCollection(() => macros.getRulesForUrl(url));

var elementSelectedInDevtools = function(element){
	currentlySelectedElement = element;
	var notification = getSelectedElementNotification();
	console.log(`selected element: `, notification)
}

var sendNotification = async function(notification){
	if(!loaded){
		await loadedPromise;
	}
	console.log(`navigation ${navigationId} sending notification: `, JSON.stringify(notification))
	macros.notifyRulesForNavigation({
		navigationId: navigationId,
		url: url,
		rules: notification.rules,
		numberOfRules: notification.numberOfRules,
		numberOfRulesThatHaveSomethingToDo: notification.numberOfRulesThatHaveSomethingToDo,
		numberOfRulesThatHaveExecuted: notification.numberOfRulesThatHaveExecuted
	});
}

function getSelectedElementNotification(){
	if(!currentlySelectedElement){
		return null;
	}
	var selector = Selector.forElement(currentlySelectedElement);
	var effect = ruleCollection.getEffectOnNode(currentlySelectedElement);
	return {
		selector, effect
	};
}

var load = async function(){
	url = location.href;
	var navigationHistoryId;
	[navigationId, navigationHistoryId] = await Promise.all([macros.navigation.getId(), macros.navigation.getHistoryId()]);
	console.log(`navigation id '${navigationId}', navigation history id '${navigationHistoryId}'`)
	ruleCollection.notifications.listen(notification => sendNotification(notification));
	await ruleCollection.refresh();
	macros.onRuleAdded(() => ruleCollection.refresh());
	macros.onRuleDeleted(({ruleId}) => ruleCollection.removeRule(ruleId));
	macros.onRuleUpdated(async ({ruleId}) => {
		ruleCollection.removeRule(ruleId);
		await ruleCollection.refresh();
	});
	macros.navigation.onReplaced(async ({navigationHistoryId: _navigationHistoryId, newNavigationId}) => {
		if(_navigationHistoryId !== navigationHistoryId){
			return;
		}
		if(newNavigationId === navigationId){
			console.log(`the navigation was replaced with one that has the same id!`);
			return;
		}
		console.log(`navigation replaced. setting url, navigationId and rules again`)
		url = location.href;
		navigationId = newNavigationId;
		await ruleCollection.refresh();
		sendNotification(ruleCollection.getNotification());
	});
	macros.onRequestToEmitRules(({navigationIds}) => {
		if(!navigationIds.some(id => navigationId === id)){
			return;
		}
		sendNotification(ruleCollection.getNotification());
	});
	macros.onExecuteRuleRequest(({ruleId, navigationId: _navigationId}, sendResponse) => {
		if(_navigationId !== navigationId){
			return;
		}
		console.log(`navigation '${navigationId}' got request to execute rule:`, ruleId);
		var rule = ruleCollection.getRule(ruleId);
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
};

loadedPromise = load();


export {elementSelectedInDevtools};