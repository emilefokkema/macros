import { ruleDefinitions } from '../../shared/rule-definitions';
import { Selector } from '../selector';

export class SuggestionCollection{
    constructor(ruleCollection){
        this.ruleCollection = ruleCollection;
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
        this.suggestions.push({
            id: ++this.latestSuggestionId,
            actionDefinition: actionDefinition,
            node: node
        });
    }
    getSuggestions(){
        return this.suggestions.map(s => ({
            suggestionId: s.id,
            actionDefinition: s.actionDefinition,
            selector: Selector.forElement(s.node)
        }));
    }
}