import { NodeFilter } from '../node-filter';
import { ValueIsNumberFilter } from '../../value-matchers/value-is-number-filter';
import { AndFilter } from '../and-filter';
import { OrFilter } from '../or-filter';
import { ValueEqualsFilter } from '../../value-matchers/value-equals-filter'
import { ParsesToIntFilter } from '../../value-matchers/parses-to-int-filter';
import { NotFilter } from '../not-filter';
import { SelfAndAllParentsFilter } from '../self-and-all-parents-filter';
import { SelfAndNoParentFilter } from '../self-and-no-parent-filter';
import { ValueFilter } from '../value-filter';
import { StylePropertyValueExtractor } from '../../value-extractors/style-property-value-extractor';
import { RectangleValueExtractor } from '../../value-extractors/rectangle-value-extractor';
import { IsInViewportValueMatcher } from '../../value-matchers/is-in-viewport-value-matcher';
import { ExceedsViewportValueMatcher } from '../../value-matchers/exceeds-viewport-value-matcher';
import { NodeNameIsOneOfFilter } from '../node-name-is-one-of-filter';
import { NodeHasTextFilter } from '../node-has-text-filter';

class ValueFilterBuilder{
    constructor(valueExtractor){
        this.valueExtractor = valueExtractor;
    }
    isNumber(){
        return new NodeFilterBuilder(new ValueFilter(this.valueExtractor, new ValueIsNumberFilter()));
    }
    equals(value){
        return new NodeFilterBuilder(new ValueFilter(this.valueExtractor, new ValueEqualsFilter(value)));
    }
    equalsInt(int){
        return new NodeFilterBuilder(new ValueFilter(this.valueExtractor, new ParsesToIntFilter(int)));
    }
    isInViewport(){
        return new NodeFilterBuilder(new ValueFilter(this.valueExtractor, new IsInViewportValueMatcher()));
    }
    exceedsViewport(){
        return new NodeFilterBuilder(new ValueFilter(this.valueExtractor, new ExceedsViewportValueMatcher()));
    }
}
export class NodeFilterBuilder{
    constructor(current){
        this.current = current || new NodeFilter();
    }
    build(){
        return this.current;
    }
    styleProperty(propertyName){
        const valueExtractor = new StylePropertyValueExtractor(propertyName);
        return new ValueFilterBuilder(valueExtractor);
    }
    hasText(){
        return new NodeFilterBuilder(new NodeHasTextFilter());
    }
    nodeNameIsOneOf(nodeNames){
        return new NodeFilterBuilder(new NodeNameIsOneOfFilter(nodeNames));
    }
    rect(){
        const valueExtractor = new RectangleValueExtractor();
        return new ValueFilterBuilder(valueExtractor);
    }
    and(filterBuilderAction){
        const builder = filterBuilderAction(new NodeFilterBuilder());
        const filter = builder.build();
        return new NodeFilterBuilder(new AndFilter([this.current, filter]));
    }
    or(filterBuilderAction){
        const builder = filterBuilderAction(new NodeFilterBuilder());
        const filter = builder.build();
        return new NodeFilterBuilder(new OrFilter([this.current, filter]));
    }
    not(){
        return new NodeFilterBuilder(new NotFilter(this.current));
    }
    selfAndAllParents(){
        return new NodeFilterBuilder(new SelfAndAllParentsFilter(this.current));
    }
    selfAndNoParent(){
        return new NodeFilterBuilder(new SelfAndNoParentFilter(this.current));
    }
}