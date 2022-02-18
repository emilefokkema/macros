export class JoinCombinator{
    constructor(joinFilter){
        this.joinFilter = joinFilter;
    }
    debugPresenceOfElementLeft(leftQuery, rightQuery, joinMethodName, element, list){

    }
    *execute(leftQuery, rightQuery, list){
        const allOnRight = [...rightQuery.executeInternal(list)];
        for(let onLeft of leftQuery.executeInternal(list)){
            const rightOnesNodeFilter = this.joinFilter.getRightFilter(onLeft);
            for(let onRight of allOnRight){
                if(rightOnesNodeFilter.nodePassesFilter(onRight)){
                    yield {left: onLeft, right: onRight}
                }
            }
        }
    }
}