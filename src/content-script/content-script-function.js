import { Macros } from '../shared/macros-class';
import { ContentScriptRuleCollection, createAction } from './content-script-rules';
import { Selector } from './selector';
import { BlockedPageSuggestionProvider } from './suggestions/blocked-page-suggestion-provider';
import { SuggestionCollection } from './suggestions/suggestion-collection';

export function contentScriptFunction(navigation, messageBus, documentMutationsProvider){
    var suggestionProviders = [new BlockedPageSuggestionProvider()];
    var suggestionCollection = new SuggestionCollection();
    var macros = new Macros(navigation, undefined, messageBus);
    var currentlySelectedElement;
    var navigationId;
    var tabId;
    var url;
    var ruleCollection = new ContentScriptRuleCollection(() => macros.getRulesForUrl(url), documentMutationsProvider);
    var suggestionCollection = new SuggestionCollection(ruleCollection);
    var loaded = false;

    var elementSelectedInDevtools = function(element){
        currentlySelectedElement = element;
        if(!loaded){
            return;
        }
        sendNotification(ruleCollection.getNotification(), getSelectedElementNotification());
    }

    var createSuggestions = function(){
        suggestionCollection.clear();
        for(const suggestionProvider of suggestionProviders){
            suggestionProvider.createSuggestions(suggestionCollection);
        }
        return suggestionCollection.getSuggestions();
    }

    function sendNotification(ruleCollectionNotification, selectedElementNotification){
        macros.notifyRulesForNavigation({
            navigationId: navigationId,
            url: url,
            tabId: tabId,
            rules: ruleCollectionNotification.rules,
            numberOfRules: ruleCollectionNotification.numberOfRules,
            numberOfRulesThatHaveSomethingToDo: ruleCollectionNotification.numberOfRulesThatHaveSomethingToDo,
            numberOfRulesThatHaveExecuted: ruleCollectionNotification.numberOfRulesThatHaveExecuted,
            selectedElement: selectedElementNotification
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
        var currentNavigation = await navigation.getCurrent();
        var navigationHistoryId = currentNavigation.historyId;
        navigationId = currentNavigation.id;
        tabId = currentNavigation.tabId;
        console.log(`navigation id '${navigationId}', navigation history id '${navigationHistoryId}', tabId ${tabId}`);
        ruleCollection.notifications.listen(notification => sendNotification(notification, getSelectedElementNotification()));
        await ruleCollection.refresh();
        macros.onRuleAdded(() => ruleCollection.refresh());
        macros.onRuleDeleted(({ruleId}) => ruleCollection.removeRule(ruleId));
        macros.onRuleUpdated(async ({ruleId}) => {
            ruleCollection.removeRule(ruleId);
            await ruleCollection.refresh();
        });
        navigation.onReplaced(async ({navigationHistoryId: _navigationHistoryId, newNavigationId}) => {
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
            sendNotification(ruleCollection.getNotification(), getSelectedElementNotification());
        });
        macros.onRequestToEmitRules(({tabId: _tabId}) => {
            if(_tabId != tabId){
                return;
            }
            sendNotification(ruleCollection.getNotification(), getSelectedElementNotification());
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
        macros.onElementSelectionChangedOnTab((_tabId) => {
            if(_tabId != tabId){
                return;
            }
            macros.notifyElementSelectionChangedForNavigation(navigationId);
        });
        macros.onExecuteActionRequest(({navigationId: _navigationId, action: actionDefinition}, sendResponse) => {
            if(_navigationId !== navigationId){
                return;
            }
            var action = createAction(actionDefinition, documentMutationsProvider);
            action.execute();
            sendResponse({});
        });
        macros.onClearSuggestions(() => {
            suggestionCollection.clear();
        });
        macros.onSuggestionsRequested((_navigationId, sendResponse) => {
            if(_navigationId !== navigationId){
                return;
            }
            console.log(`navigation '${navigationId}' creating suggestions`);
            sendResponse(createSuggestions());
        });
        loaded = true;
    };
    
    load();

    return {elementSelectedInDevtools};
}