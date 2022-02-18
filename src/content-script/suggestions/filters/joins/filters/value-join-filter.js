import { JoinFilter } from './join-filter';
import { ValueFilter } from '../../node-filters/value-filter';

export class ValueJoinFilter extends JoinFilter{
    constructor(thisValueMatcherFactory, otherValueExtractor){
        super();
        this.thisValueMatcherFactory = thisValueMatcherFactory;
        this.otherValueExtractor = otherValueExtractor;
    }
    getRightFilter(left){
        const valueMatcher = this.thisValueMatcherFactory(left);
        return new ValueFilter(this.otherValueExtractor, valueMatcher);
    }
}