import { LeftJoinResultFilterBuilder } from "./result-filters/builders/left-join-result-filter-builder";
import { LeftJoinResultFilter } from "./result-filters/left-join-result-filter";

export class LeftJoinCombinator{
    constructor(joinFilter, resultFilter){
        this.joinFilter = joinFilter;
        this.resultFilter = resultFilter || new LeftJoinResultFilter();
    }
    where(resultFilterBuilderAction){
        const builder = resultFilterBuilderAction(new LeftJoinResultFilterBuilder());
        const resultFilter = builder.build();
        return new LeftJoinCombinator(this.joinFilter, resultFilter);
    }
    debugPresenceOfElementLeft(leftQuery, rightQuery, joinMethodName, element, list){
        const presentInLeftQueryResult = leftQuery.debugPresenceOfElement(element, list);
        if(!presentInLeftQueryResult.present){
            return {
                message: `${presentInLeftQueryResult.message}.${joinMethodName}(...)`,
                present: false
            }
        }
        const rightOnesNodeFilter = this.joinFilter.getRightFilter(presentInLeftQueryResult.present);
        const allowRight = this.resultFilter.allowsRightPresent();
        if(!allowRight){
            for(let onRight of rightQuery.executeInternal(list)){
                if(rightOnesNodeFilter.nodePassesFilter(onRight)){
                    return {
                        message: `${presentInLeftQueryResult.message}.${joinMethodName}(...\x1b[31m<-- something was found on the right side\x1b[37m)`,
                        present: false
                    };
                }
            }
        }
        return {
            message: ``,
            present: presentInLeftQueryResult.present
        };
    }
    *execute(leftQuery, rightQuery, list){
        const allOnRight = [...rightQuery.executeInternal(list)];
        const allowRight = this.resultFilter.allowsRightPresent();
        for(let onLeft of leftQuery.executeInternal(list)){
            const rightOnesNodeFilter = this.joinFilter.getRightFilter(onLeft);
            if(!allowRight && !allOnRight.some(n => rightOnesNodeFilter.nodePassesFilter(n))){
                yield {left: onLeft};
            }
        }
    }
}