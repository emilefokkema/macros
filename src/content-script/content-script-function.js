import { Macros } from '../shared/macros-class';
import { ContentScriptRuleCollection, createAction } from './content-script-rules';
import { Selector } from '../shared/selector';
import { BlockedPageSuggestionProvider } from './suggestions/blocked-page-suggestion-provider';
import { UnscrollablePageSuggestionProvider } from './suggestions/unscrollable-page-suggestion-provider';
import { SuggestionCollection } from './suggestions/suggestion-collection';
import { ElementIndicator } from './suggestions/element-indicator';
import { ClassRepository } from './suggestions/class-repository';
import { HiddenTextSuggestionProvider } from './suggestions/hidden-text-suggestion-provider';

export function contentScriptFunction(navigation, messageBus, documentMutationsProvider){
    var classRepository = new ClassRepository();
    var suggestionProviders = [
        new BlockedPageSuggestionProvider(),
        new UnscrollablePageSuggestionProvider(classRepository),
        new HiddenTextSuggestionProvider(classRepository)
    ];
    var macros = new Macros(navigation, undefined, messageBus);
    var currentlySelectedElement;
    var navigationId;
    var tabId;
    var url;
    var ruleCollection = new ContentScriptRuleCollection(
        macros,
        documentMutationsProvider);
    var suggestionCollection = new SuggestionCollection(
        ruleCollection,
        new ElementIndicator(),
        documentMutationsProvider,
        suggestionProviders);

    var debugSuggestionsForElement = function(element){
        suggestionCollection.debugSuggestionsForElement(element);
    }

    function sendNotification(ruleCollectionNotification){
        macros.notifyRulesForNavigation({
            navigationId: navigationId,
            url: url,
            tabId: tabId,
            rules: ruleCollectionNotification.rules,
            numberOfRules: ruleCollectionNotification.numberOfRules,
            numberOfRulesThatHaveSomethingToDo: ruleCollectionNotification.numberOfRulesThatHaveSomethingToDo,
            numberOfRulesThatHaveExecuted: ruleCollectionNotification.numberOfRulesThatHaveExecuted
        });
    }

    function getElementSelectedInDevtools(node){
        const htmlElement = node instanceof HTMLElement ? node : null;
        currentlySelectedElement = htmlElement;
        ruleCollection.addEffectsForElementSelectedInDevtools(htmlElement);
        if(!htmlElement){
            if(node){
                return {tabId, navigationId, selector: null, isHtmlElement: false};
            }
            return null;
        }
        return {tabId, navigationId, selector: Selector.forElement(htmlElement), isHtmlElement: true}
    }

    function onElementSelectedInDevtools(node){
        const element = getElementSelectedInDevtools(node);
        if(element){
            macros.notifySelectedElementInDevtools(element);
        }
    }

    function notifyRuleStateChanged(ruleId){
        const stateForRule = ruleCollection.getStateForRule(ruleId);
        macros.notifyRuleStateForNavigationChanged(navigationId, stateForRule);
    }

    function notifyDraftRuleStateChanged(){
        const stateForDraftRule = ruleCollection.getStateForDraftRule();
        macros.notifyDraftRuleStateForNavigation(navigationId, stateForDraftRule);
    }

    var load = async function(){
        url = location.href;
        var currentNavigation = await navigation.getCurrent();
        var navigationHistoryId = currentNavigation.historyId;
        navigationId = currentNavigation.id;
        tabId = currentNavigation.tabId;
        console.log(`navigation id '${navigationId}', navigation history id '${navigationHistoryId}', tabId ${tabId}`);
        ruleCollection.notifications.listen(notification => {
            console.log(`something happened to the rule collection; sending notification`)
            sendNotification(notification)
        });
        ruleCollection.ruleHasSomethingToDoChanged.listen(({ruleId, hasSomethingToDo}) => {
            notifyRuleStateChanged(ruleId);
        });
        ruleCollection.ruleEditableChanged.listen(({ruleId}) => {
            notifyRuleStateChanged(ruleId);
        });
        ruleCollection.ruleExecuted.listen(({ruleId}) => {
            notifyRuleStateChanged(ruleId);
        });
        ruleCollection.draftRuleHasSomethingToDoChanged.listen(() => {
            notifyDraftRuleStateChanged();
        });
        ruleCollection.effectOnElementSelectedInDevtoolsChanged.listen(({ruleId}) => {
            notifyRuleStateChanged(ruleId);
        });
        ruleCollection.effectOfDraftRuleOnElementSelectedInDevtoolsChanged.listen(() => {
            notifyDraftRuleStateChanged();
        });
        ruleCollection.ruleRemoved.listen(({ruleId}) => {
            macros.notifyRuleStateForNavigationRemoved(navigationId, ruleId);
        });
        ruleCollection.ruleAdded.listen(({ruleId}) => {
            notifyRuleStateChanged(ruleId);
        });
        await ruleCollection.refresh(url, navigationId, currentlySelectedElement);
        macros.onDraftRuleCreated(({navigationId: _navigationId, draftRule}) => {
            if(_navigationId !== navigationId){
                return;
            }
            ruleCollection.setDraftRuleForDefinition(draftRule, currentlySelectedElement);
            notifyDraftRuleStateChanged();
        });
        macros.onDraftRuleChanged(({navigationId: _navigationId, draftRule}) => {
            if(_navigationId !== navigationId){
                return;
            }
            ruleCollection.setDraftRuleForDefinition(draftRule, currentlySelectedElement);
            notifyDraftRuleStateChanged();
        });
        macros.onDraftRulesRemoved((navigationIds) => {
            if(!navigationIds.some(id => id === navigationId)){
                return;
            }
            ruleCollection.setDraftRuleForDefinition(null);
            notifyDraftRuleStateChanged();
        });
        macros.onRuleAdded(() => ruleCollection.refresh(url, navigationId, currentlySelectedElement));
        macros.onRuleDeleted(({ruleId}) => ruleCollection.removeRule(ruleId));
        macros.onRuleUpdated(async ({ruleId}) => {
            ruleCollection.removeRule(ruleId);
            await ruleCollection.refresh(url, navigationId, currentlySelectedElement);
            const newRuleState = ruleCollection.getStateForRule(ruleId);
            if(!newRuleState){
                macros.notifyRuleStateForNavigationRemoved(navigationId, ruleId);
            }
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
            await ruleCollection.refresh(url, navigationId, currentlySelectedElement);
            sendNotification(ruleCollection.getNotification());
        });
        macros.onExecuteRuleRequest(({ruleId, navigationId: _navigationId}, sendResponse) => {
            if(_navigationId !== navigationId){
                return;
            }
            console.log(`navigation '${navigationId}' got request to execute rule:`, ruleId);
            ruleCollection.executeRule(ruleId);
            sendResponse({});
        });
        macros.onExecuteSuggestionRequest(({suggestionId, navigationId: _navigationId}, sendResponse) => {
            if(_navigationId !== navigationId){
                return;
            }
            suggestionCollection.executeSuggestion(suggestionId);
            sendResponse({});
        });
        macros.onUndoSuggestionRequest(({suggestionId, navigationId: _navigationId}, sendResponse) => {
            if(_navigationId !== navigationId){
                return;
            }
            suggestionCollection.undoSuggestion(suggestionId);
            sendResponse({});
        });
        macros.onGetSuggestionsRequest(({navigationId: _navigationId}, sendResponse) => {
            if(_navigationId !== navigationId){
                return;
            }
            suggestionCollection.ensureLoaded();
            sendResponse(suggestionCollection.getSuggestions());
        });
        macros.onReloadSuggestionsRequest(({navigationId: _navigationId}, sendResponse) => {
            if(_navigationId !== navigationId){
                return;
            }
            suggestionCollection.reload();
            sendResponse(suggestionCollection.getSuggestions());
        });
        macros.onMarkSuggestionAsRemoved(({suggestionId, navigationId: _navigationId}, sendResponse) => {
            if(_navigationId !== navigationId){
                return;
            }
            suggestionCollection.markSuggestionAsRemoved(suggestionId);
            sendResponse({});
        });
        macros.onExecuteActionRequest(({navigationId: _navigationId, action: actionDefinition}, sendResponse) => {
            if(_navigationId !== navigationId){
                return;
            }
            var action = createAction(actionDefinition, documentMutationsProvider);
            action.execute();
            sendResponse({});
        });
        macros.onNotifySuggestionIndicationStart(({navigationId: _navigationId, suggestionId}) => {
            if(_navigationId !== navigationId){
                return;
            }
            suggestionCollection.startHighlightingSuggestion(suggestionId);
        });
        macros.onNotifySuggestionIndicationEnd(({navigationId: _navigationId, suggestionId}) => {
            if(_navigationId !== navigationId){
                return;
            }
            suggestionCollection.stopHighlightingSuggestion();
        });
        macros.onGetAndRemoveSuggestionRequest(({suggestionId, navigationId: _navigationId}, sendResponse) => {
            if(_navigationId !== navigationId){
                return;
            }
            sendResponse(suggestionCollection.getAndRemoveSuggestionById(suggestionId));
        });
        macros.onGetRuleStatesForNavigation(({navigationId: _navigationId}, sendResponse) => {
            if(_navigationId !== navigationId){
                return;
            }
            sendResponse(ruleCollection.getStates());
        });
        macros.onDraftRuleStateForNavigationRequest(({navigationId: _navigationId}, sendResponse) => {
            if(_navigationId !== navigationId){
                return;
            }
            const result = ruleCollection.getStateForDraftRule();
            sendResponse(result);
        });
        macros.onRequestToExecuteDraftRule(({navigationId: _navigationId}, sendResponse) => {
            if(_navigationId !== navigationId){
                return;
            }
            ruleCollection.executeDraftRule();
            sendResponse({})
            notifyDraftRuleStateChanged();
        });
        macros.onEditedStatusChanged(({ruleId, otherNavigationId, edited}) => {
            if(ruleId === undefined){
                return;
            }
            if(!edited){
                ruleCollection.setEditable(ruleId, true);
            }
            else if(edited && otherNavigationId !== navigationId){
                ruleCollection.setEditable(ruleId, false);
            }
        });
    };
    
    load();

    return {onElementSelectedInDevtools, debugSuggestionsForElement, getElementSelectedInDevtools};
}