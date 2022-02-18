import { Selector } from '../../shared/selector';
import { ruleDefinitions } from '../../shared/rule-definitions';
import { SelectActionSuggestion } from './select-action-suggestion';

export class SelectActionSuggestionForNode extends SelectActionSuggestion{
    constructor(node, selectorText, nodeActionDefinition, selectActionDefinition, description){
        super(selectorText, nodeActionDefinition, selectActionDefinition, description);
        this.node = node;
    }
    highlight(elementIndicator){
        if(this.hasExecuted){
            return;
        }
        elementIndicator.startIndicatingElement(this.node);
    }
    static create(node, nodeActionDefinition, description){
        const selector = Selector.forElement(node);
        const selectActionDefinition = ruleDefinitions.getSelectActionDefinition(selector.text, nodeActionDefinition);
        return new SelectActionSuggestionForNode(node, selector.text, nodeActionDefinition, selectActionDefinition, description);
    }
}