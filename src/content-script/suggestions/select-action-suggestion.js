import { Suggestion } from './suggestion';
import { ruleDefinitions } from '../../shared/rule-definitions';

export class SelectActionSuggestion extends Suggestion{
    constructor(selectorText, nodeActionDefinition, selectActionDefinition, description){
        super(selectActionDefinition, description);
        this.selectorText = selectorText;
        this.nodeActionDefinition = nodeActionDefinition;
    }
    equals(otherSelectActionSuggestion){
        return !!otherSelectActionSuggestion && 
            otherSelectActionSuggestion.selectorText === this.selectorText && 
            ruleDefinitions.nodeActionsAreEqual(this.nodeActionDefinition, otherSelectActionSuggestion.nodeActionDefinition)
    }
    isAchievedByRules(ruleCollection){
        let nodesCheckedCount = 0;
        for(let selectedNode of document.querySelectorAll(this.selectorText)){
            if(!this.isAchievedByRulesForNode(selectedNode, ruleCollection)){
                return false;
            }
            nodesCheckedCount++;
        }
        return true;
    }
    isAchievedByRulesForNode(node, ruleCollection){
        const effect = ruleCollection.getEffectOnNode(node);
        for(const effectsForRule of effect){
            for(const effectForRule of effectsForRule.effect){
                if(ruleDefinitions.actionIsAchievedByOther(this.nodeActionDefinition, effectForRule.actionDefinition)){
                    return true;
                }
            }
        }
        return false;
    }
    performsActionForNode(node, nodeActionDefinition){
        if(!node){
            return false;
        }
        var nodeMatchesSelector = false;
        try{
            nodeMatchesSelector = node.matches(this.selectorText);
        }catch(e){
            console.log(`problem executing node.matches`, node, this.selectorText);
            return false;
        }
        if(!nodeMatchesSelector){
            return false;
        }
        return ruleDefinitions.actionIsAchievedByOther(nodeActionDefinition, this.nodeActionDefinition);
    }
    static create(selectorText, nodeActionDefinition, description){
        const selectActionDefinition = ruleDefinitions.getSelectActionDefinition(selectorText, nodeActionDefinition);
        return new SelectActionSuggestion(selectorText, nodeActionDefinition, selectActionDefinition, description);
    }
}