export class SuggestionCollection{
    constructor(ruleCollection){
        this.ruleCollection = ruleCollection;
    }
    clear(){

    }
    addNodeActionSuggestion(node, actionDefinition){
        const effect = this.ruleCollection.getEffectOnNode(node);
        console.log(`the effect on node is:`, node, effect)
    }
    getSuggestions(){
        return {foo: 9};
    }
}