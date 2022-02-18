import { ruleDefinitions } from '../../shared/rule-definitions';
import { NodeFilterContextListQuery } from './filters/node-filter-context';

export class BlockedPageSuggestionProvider{

    constructor(){
        this.query = NodeFilterContextListQuery.create(list => list.where(
            x => x.styleProperty('z-index').isNumber().and(
            x => x.rect().isInViewport()).and(
            x => x.styleProperty('position').equals('relative').not()).and(
                x => x.styleProperty('opacity').equals('0').or(
                x => x.styleProperty('visibility').equals('hidden')).or(
                x => x.styleProperty('display').equals('none')).or(
                    x => x.styleProperty('width').equalsInt(0).and(
                    x => x.styleProperty('height').equalsInt(0)
                    )
                ).not().selfAndAllParents()
            ).selfAndNoParent())
        .leftJoinSelf((thisOne, otherOne) => 
            otherOne.styleProperty('z-index').greaterThan(thisOne.styleProperty('z-index')).and(
            otherOne => otherOne.rect().intersects(thisOne.rect())))
        .where(otherOne => otherOne.absent())
        .selectLeft());
    }
    debugSuggestionForElement(element, filterContextList){
        const result = this.query.debugPresenceOfElement(element, filterContextList);
        if(!result.pass){
            console.log('BlockedPageSuggestionProvider says that this element does not block the page:')
            console.log(result.message);
        }else{
            console.log('BlockedPageSuggestionProvider says that this element blocks the page')
        }
    }
    createSuggestions(suggestionCollection, filterContextList){
        for(const passed of this.query.execute(filterContextList)){
            suggestionCollection.addNodeActionSuggestion(passed, ruleDefinitions.getDeleteActionDefinition(), 'delete');
        }
    }
}
