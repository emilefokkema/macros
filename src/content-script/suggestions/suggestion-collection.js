import { ruleDefinitions } from '../../shared/rule-definitions';
import { Selector } from '../selector';

export class SuggestionCollection{
    constructor(ruleCollection, elementIndicator){
        this.ruleCollection = ruleCollection;
        this.elementIndicator = elementIndicator;
        this.latestSuggestionId = -1;
        this.suggestions = [];
    }
    clear(){
        this.suggestions = [];
    }
    addNodeActionSuggestion(node, actionDefinition){
        
        const effect = this.ruleCollection.getEffectOnNode(node);
        for(const effectsForRule of effect){
            for(const effectForRule of effectsForRule.effect){
                if(ruleDefinitions.actionIsAchievedByOther(actionDefinition, effectForRule.actionDefinition)){
                    return;
                }
            }
        }
        for(const suggestion of this.suggestions){
            if(suggestion.node === node && ruleDefinitions.actionIsAchievedByOther(actionDefinition, suggestion.actionDefinition)){
                return;
            }
        }
        console.log(`adding suggestion for node`, node)
        this.suggestions.push({
            id: ++this.latestSuggestionId,
            actionDefinition: actionDefinition,
            node: node
        });
    }
    getSuggestions(){
        const result = this.suggestions.map(s => ({
            suggestionId: s.id,
            actionDefinition: s.actionDefinition,
            selector: Selector.forElement(s.node)
        }));
        console.log(`returning suggestions`, result);
        return result;
    }
    startHighlightingSuggestion(suggestionId){
        const suggestion = this.suggestions.find(s => s.id === suggestionId);
        console.log(`going to start indicating`, suggestion)
        this.elementIndicator.startIndicatingElement(suggestion.node);
    }
    stopHighlightingSuggestion(suggestionId){
        this.elementIndicator.stopIndicatingElement();
    }
}