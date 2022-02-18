import { SuggestionProvider } from './suggestion-provider';
import { NodeFilterContextListQuery } from './filters/node-filter-context';

export class HiddenTextSuggestionProvider extends SuggestionProvider{
    constructor(classRepository){
        super(classRepository);
        this.query = NodeFilterContextListQuery.create(list => list
            .where(x => x.hasText().and(x => x.nodeNameIsOneOf(['script','style']).not()))
            .join(list => list.where(
                x => x.styleProperty('display').equals('none').and(
                x => x.nodeNameIsOneOf(['script','head','title','style']).not()
                ).selfAndNoParent()), (one, other) => other.isSameAsOrParentOf(one)).selectRight().distinct());
    }
    debugSuggestionForElement(element, filterContextList){
        const result = this.query.debugPresenceOfElement(element, filterContextList);
        if(!result.pass){
            console.log('HiddenTextSuggestionProvider says that this element does not hide text:')
            console.log(result.message);
        }else{
            console.log('HiddenTextSuggestionProvider says that this element hides text')
        }
    }
    createSuggestions(suggestionCollection, filterContextList){
        this.addSuggestionsToRemoveStylePropertiesFromNodes(this.query.execute(filterContextList), ['display'], suggestionCollection, 'display text');
    }
}