import { ruleDefinitions } from '../../shared/rule-definitions';
import { Selector } from '../selector';
import { createSelectedNodeAction } from '../content-script-rules';

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
            node: node,
            hasExecuted: false
        });
    }
    getSuggestions(){
        const result = this.suggestions.map(s => ({
            suggestionId: s.id,
            actionDefinition: s.actionDefinition,
            selector: Selector.forElement(s.node),
            hasExecuted: s.hasExecuted
        }));
        return result;
    }
    executeSuggestion(suggestionId){
        const suggestion = this.suggestions.find(s => s.id === suggestionId);
        if(!suggestion){
            return;
        }
        console.log(`going to execute suggestion`, suggestion)
        this.elementIndicator.stopIndicatingElement(suggestion.node);
        var action = createSelectedNodeAction(suggestion.actionDefinition);
        action.execute(suggestion.node);
        suggestion.hasExecuted = true;
    }
    startHighlightingSuggestion(suggestionId){
        const suggestion = this.suggestions.find(s => s.id === suggestionId);
        this.elementIndicator.startIndicatingElement(suggestion.node);
    }
    stopHighlightingSuggestion(){
        this.elementIndicator.stopIndicatingElement();
    }
}