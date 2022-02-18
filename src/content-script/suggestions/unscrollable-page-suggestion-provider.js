import { SuggestionProvider } from './suggestion-provider';
import { NodeFilterContextListQuery } from './filters/node-filter-context';

export class UnscrollablePageSuggestionProvider extends SuggestionProvider{
    constructor(classRepository){
        super(classRepository);
        this.query = NodeFilterContextListQuery.create(list => list
            .where(x => x.rect().exceedsViewport())
            .join(list => list.where(
                x => x.styleProperty('overflow-x').equals('hidden').or(
                x => x.styleProperty('overflow-y').equals('hidden')
                )), (one, other) => other.isSameAsOrParentOf(one)).selectRight().distinct());
    }
    debugSuggestionForElement(element, filterContextList){
        const result = this.query.debugPresenceOfElement(element, filterContextList);
        if(!result.pass){
            console.log('UnscrollablePageSuggestionProvider says that this element does not prevent scolling:')
            console.log(result.message);
        }else{
            console.log('UnscrollablePageSuggestionProvider says that this element prevents scrolling')
        }
    }
    createSuggestions(suggestionCollection, filterContextList){
        this.addSuggestionsToRemoveStylePropertiesFromNodes(this.query.execute(filterContextList), ['overflow-x', 'overflow-y'], suggestionCollection, 'show overflow');
    }
}