import { createAction } from '../content-script-rules';

export class Suggestion{
    constructor(actionDefinition, description){
        this.id = undefined;
        this.actionDefinition = actionDefinition;
        this.description = description;
        this.hasExecuted = false;
        this.undoing = undefined;
        this.removed = false;
    }
    isAchievedByRules(ruleCollection){
        return false;
    }
    performsActionForNode(node, nodeActionDefinition){
        return false;
    }
    highlight(elementIndicator){

    }
    setAsRemoved(){
        this.removed = true;
    }
    execute(documentMutationsProvider){
        const action = createAction(this.actionDefinition, documentMutationsProvider);
        this.undoing = action.execute();
        this.hasExecuted = true;
    }
    undo(){
        if(!this.undoing){
            return;
        }
        this.undoing.execute();
        this.undoing = undefined;
        this.hasExecuted = false;
    }
    getSummary(){
        return {
            id: this.id,
            actionDefinition: this.actionDefinition,
            hasExecuted: this.hasExecuted,
            description: this.description
        };
    }
}