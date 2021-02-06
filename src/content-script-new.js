import { macros } from './shared/macros';
import { CombinedEventSource, Event } from './shared/events';
import { ContentScriptRule, createAction } from './content-script-rules';

var currentlySelectedElement;
var navigationId;
var url;
var loadedPromise;
var loaded = false;

class ContentScriptRuleCollection{
	constructor(getAllDefinitionsAsync){
		this.getAllDefinitionsAsync = getAllDefinitionsAsync;
		this.ruleHasSomethingToDoChanged = new CombinedEventSource([]);
		this.collectionUpdated = new Event();
		this.notifications = new CombinedEventSource([this.collectionUpdated, this.ruleHasSomethingToDoChanged])
			.map(() => [this.getNotification()]);
		this.rules = [];
	}
	async refresh(){
		var definitions = await this.getAllDefinitionsAsync();
		var currentRuleIds = this.rules.map(r => r.id);
		var oldRuleIds = currentRuleIds.filter(id => !definitions.some(d => d.id === id));
		for(let oldRuleId of oldRuleIds){
			this.removeRule(oldRuleId);
		}
		var newDefinitions = definitions.filter(d => !currentRuleIds.some(id => id === d.id));
		for(let newDefinition of newDefinitions){
			this.addRuleForDefinition(newDefinition);
		}
		if(oldRuleIds.length > 0 || newDefinitions.length > 0){
			this.collectionUpdated.dispatch();
		}
	}
	getRule(ruleId){
		return this.rules.find(r => r.id === ruleId);
	}
	addRuleForDefinition(definition){
		var rule = new ContentScriptRule(definition);
		this.rules.push(rule);
		this.ruleHasSomethingToDoChanged.addSource(rule.hasSomethingToDoChanged);
	}
	removeRule(ruleId){
		var index = this.rules.findIndex(r => r.id === ruleId);
		if(index === -1){
			return;
		}
		var [rule] = this.rules.splice(index, 1);
		this.ruleHasSomethingToDoChanged.removeSource(rule.hasSomethingToDoChanged);
	}
	getNotification(){
		var ruleNotifications = this.rules.map(r => r.getNotification());
		return {
			rules: ruleNotifications,
			numberOfRules: ruleNotifications.length,
			numberOfRulesThatHaveSomethingToDo: ruleNotifications.filter(r => r.hasSomethingToDo).length,
			numberOfRulesThatHaveExecuted: ruleNotifications.filter(r => r.hasExecuted).length
		};
	}
}

var ruleCollection = new ContentScriptRuleCollection(() => macros.getRulesForUrl(url));

var elementSelectedInDevtools = function(element){
	currentlySelectedElement = element;
}

var sendNotification = async function(notification){
	if(!loaded){
		await loadedPromise;
	}
	console.log(`sending notification: `, JSON.stringify(notification))
	macros.notifyRulesForNavigation({
		navigationId: navigationId,
		url: url,
		rules: notification.rules,
		numberOfRules: notification.numberOfRules,
		numberOfRulesThatHaveSomethingToDo: notification.numberOfRulesThatHaveSomethingToDo,
		numberOfRulesThatHaveExecuted: notification.numberOfRulesThatHaveExecuted
	});
}

var load = async function(){
	url = location.href;
	var navigationHistoryId;
	[navigationId, navigationHistoryId] = await Promise.all([macros.navigation.getId(), macros.navigation.getHistoryId()]);
	console.log(`navigation id '${navigationId}', navigation history id '${navigationHistoryId}'`)
	ruleCollection.notifications.listen(notification => sendNotification(notification));
	await ruleCollection.refresh();
	//setRules(await macros.getRulesForUrl(url));
	// macros.onRuleAdded(async () => {
	// 	var newRules = await macros.getRulesForUrl(url);
	// 	var newRuleDefinition = newRules.find(r => !rules.some(rr => rr.id === r.id));
	// 	if(!newRuleDefinition){
	// 		return;
	// 	}
	// 	console.log(`a rule was added for ${url}`)
	// 	var newRule = new ContentScriptRule(newRuleDefinition);
	// 	newRule.hasSomethingToDoChanged.listen(() => notify(), cancellationToken);
	// 	rules.push(newRule);
	// 	notify();
	// });
	// macros.onRuleDeleted(({ruleId}) => {
	// 	var ruleIndexToRemove = rules.findIndex(r => r.id === ruleId);
	// 	if(ruleIndexToRemove === -1){
	// 		return;
	// 	}
	// 	console.log(`removing rule ${ruleId}`)
	// 	var [ruleToRemove] = rules.splice(ruleIndexToRemove, 1);
	// 	ruleToRemove.dispose();
	// 	notify();
	// });
	// macros.onRuleUpdated(async ({ruleId}) => {
	// 	var ruleIndexToUpdate = rules.findIndex(r => r.id === ruleId);
	// 	if(ruleIndexToUpdate === -1){
	// 		return;
	// 	}
	// 	console.log(`replacing rule ${ruleId}`);
	// 	var replacementRuleDefinition = (await macros.getRulesForUrl(url)).find(r => r.id === ruleId);
	// 	var oldRule;
	// 	if(replacementRuleDefinition){
	// 		var replacementRule = new ContentScriptRule(replacementRuleDefinition);
	// 		replacementRule.hasSomethingToDoChanged.listen(() => notify(), cancellationToken);
	// 		[oldRule] = rules.splice(ruleIndexToUpdate, 1, replacementRule);
	// 	}else{
	// 		[oldRule] = rules.splice(ruleIndexToUpdate, 1);
	// 	}
	// 	oldRule.dispose();
	// 	notify();
	// });
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