import { JoinFilter } from '../join-filter';
import { StylePropertyValueExtractor } from '../../../value-extractors/style-property-value-extractor';
import { ValueIsNumberGreaterThanFilter } from '../../../value-matchers/value-is-number-greater-than-filter';
import { ValueJoinFilter } from '../value-join-filter';
import { AndJoinFilter } from '../and-join-filter';
import { RectangleValueExtractor } from '../../../value-extractors/rectangle-value-extractor';
import { IntersectsRectValueMatcher } from '../../../value-matchers/intersects-rect-value-matcher';
import { IsSameAsOrParentOfMatcher } from '../../../value-matchers/is-same-as-or-parent-of-matcher';
import { SelfExtractor } from '../../../value-extractors/self-extractor';

class ValueJoinFilterBuilder{
    constructor(otherValueExtractor){
        this.otherValueExtractor = otherValueExtractor;
    }
    greaterThan(thisValueExtractor){
        const joinFilter = new ValueJoinFilter(
            thisOne => new ValueIsNumberGreaterThanFilter(thisValueExtractor.getValue(thisOne)),
            this.otherValueExtractor);
        return new JoinFilterBuilder(joinFilter);
    }
    intersects(thisValueExtractor){
        const joinFilter = new ValueJoinFilter(
            thisOne => new IntersectsRectValueMatcher(thisValueExtractor.getValue(thisOne)),
            this.otherValueExtractor);
        return new JoinFilterBuilder(joinFilter);
    }
}

export class JoinFilterBuilder{
    constructor(current){
        this.current = current || new JoinFilter();
    }
    styleProperty(propertyName){
        const valueExtractor = new StylePropertyValueExtractor(propertyName);
        return new ValueJoinFilterBuilder(valueExtractor);
    }
    rect(){
        const valueExtractor = new RectangleValueExtractor();
        return new ValueJoinFilterBuilder(valueExtractor);
    }
    build(){
        return this.current;
    }
    and(filterBuilderAction){
        const builder = filterBuilderAction(new JoinFilterBuilder());
        const filter = builder.build();
        return new JoinFilterBuilder(new AndJoinFilter(this.current, filter));
    }
    isSameAsOrParentOf(joinDataProvider){
        const joinFilter = new ValueJoinFilter(thisOne => new IsSameAsOrParentOfMatcher(thisOne), new SelfExtractor());
        return new JoinFilterBuilder(joinFilter);
    }
}