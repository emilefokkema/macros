import { ruleDefinitions } from '../../shared/rule-definitions';

export class SuggestionProvider{
    constructor(classRepository){
        this.classRepository = classRepository;
    }
    addSuggestionsToRemoveStylePropertiesFromNodes(nodes, styleProperties, suggestionCollection, description){
        const classesToRemove = [];
        for(let node of nodes){
            for(let styleProperty of styleProperties){
                if(node.style.getPropertyValue(styleProperty) !== ''){
                    suggestionCollection.addNodeActionSuggestion(node, ruleDefinitions.getRemoveStylePropertyActionDefinition(styleProperty), description);
                }
            }
            for(let classThatLeadsToStyleProperty of this.classRepository.getClassesThatLeadToPropertiesOnElement(node, styleProperties)){
                if(!classesToRemove.includes(classThatLeadsToStyleProperty)){
                    classesToRemove.push(classThatLeadsToStyleProperty);
                }
            }
        }
        for(let classToRemove of classesToRemove){
            suggestionCollection.addSelectActionSuggestion(`.${classToRemove}`, ruleDefinitions.getRemoveClassActionDefinition(classToRemove), description);
        }
    }
}