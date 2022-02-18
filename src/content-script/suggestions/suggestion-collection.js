import { NodeFilterContext } from './filters/node-filter-context';
import { SelectActionSuggestionForNode } from './select-action-suggestion-for-node';
import { SelectActionSuggestion } from './select-action-suggestion';

export class SuggestionCollection{
    constructor(ruleCollection, elementIndicator, documentMutationsProvider, suggestionProviders){
        this.ruleCollection = ruleCollection;
        this.elementIndicator = elementIndicator;
        this.documentMutationsProvider = documentMutationsProvider;
        this.latestSuggestionId = -1;
        this.suggestions = [];
        this.suggestionProviders = suggestionProviders;
        this.loaded = false;
    }
    clear(){
        this.suggestions = [];
    }
    removeSuggestion(suggestion){
        const index = this.suggestions.indexOf(suggestion);
        if(index > -1){
            this.suggestions.splice(index, 1);
        }
    }
    addSelectActionSuggestion(selectorText, actionDefinition, description){
        const suggestion = SelectActionSuggestion.create(selectorText, actionDefinition, description);
        if(suggestion.isAchievedByRules(this.ruleCollection)){
            return;
        }
        for(const existingSuggestion of this.suggestions){
            if(existingSuggestion instanceof SelectActionSuggestion && suggestion.equals(existingSuggestion)){
                return;
            }
        }
        var newSuggestionId = ++this.latestSuggestionId;
        suggestion.id = newSuggestionId;
        this.suggestions.push(suggestion);
    }
    addNodeActionSuggestion(node, actionDefinition, description){
        const suggestion = SelectActionSuggestionForNode.create(node, actionDefinition, description);
        if(suggestion.isAchievedByRules(this.ruleCollection)){
            return;
        }
        for(const existingSuggestion of this.suggestions){
            if(existingSuggestion.performsActionForNode(node, actionDefinition)){
                return;
            }
        }
        var newSuggestionId = ++this.latestSuggestionId;
        suggestion.id = newSuggestionId;
        this.suggestions.push(suggestion);
    }
    getAndRemoveSuggestionById(suggestionId){
        const index = this.suggestions.findIndex(s => s.id === suggestionId);
        if(index === -1){
            return null;
        }
        const suggestion = this.suggestions[index];
        this.suggestions.splice(index, 1);
        return suggestion.getSummary();
    }
    ensureLoaded(){
        if(this.loaded){
            return;
        }
        this.createSuggestions();
        this.loaded = true;
    }
    reload(){
        this.createSuggestions();
    }
    createSuggestions(){
        this.stopHighlightingSuggestion();
        for(let unexecutedSuggestion of this.suggestions.filter(s => !s.hasExecuted)){
            this.removeSuggestion(unexecutedSuggestion);
        }
        const filterContexts = NodeFilterContext.getAll();
        for(const suggestionProvider of this.suggestionProviders){
            suggestionProvider.createSuggestions(this, filterContexts);
        }
    }
    debugSuggestionsForElement(element){
        const filterContexts = NodeFilterContext.getAll();
        for(const suggestionProvider of this.suggestionProviders){
            suggestionProvider.debugSuggestionForElement(element, filterContexts);
        }
    }
    getSuggestions(){
        return this.suggestions.filter(s => !s.removed).map(s => s.getSummary());
    }
    undoSuggestion(suggestionId){
        const suggestion = this.suggestions.find(s => s.id === suggestionId);
        if(!suggestion){
            return;
        }
        suggestion.undo();
    }
    executeSuggestion(suggestionId){
        const suggestion = this.suggestions.find(s => s.id === suggestionId);
        if(!suggestion){
            return;
        }
        this.elementIndicator.stopIndicatingElement();
        suggestion.execute(this.documentMutationsProvider);
    }
    markSuggestionAsRemoved(suggestionId){
        const suggestion = this.suggestions.find(s => s.id === suggestionId);
        if(!suggestion){
            return;
        }
        suggestion.setAsRemoved();
    }
    startHighlightingSuggestion(suggestionId){
        const suggestion = this.suggestions.find(s => s.id === suggestionId);
        if(suggestion.hasExecuted){
            return;
        }
        suggestion.highlight(this.elementIndicator);
    }
    stopHighlightingSuggestion(){
        this.elementIndicator.stopIndicatingElement();
    }
}