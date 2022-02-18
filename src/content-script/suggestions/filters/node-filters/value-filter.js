import { NodeFilter } from './node-filter';

export class ValueFilter extends NodeFilter{
    constructor(valueExtractor, valueMatcher){
        super();
        this.valueExtractor = valueExtractor;
        this.valueMatcher = valueMatcher;
    }
    nodePassesFilter(nodeContext){
        const value = this.valueExtractor.getValue(nodeContext);
        return this.valueMatcher.valuePassesFilter(value);
    }
    debugNodePassesFilter(nodeContext){
        const value = this.valueExtractor.getValue(nodeContext);
        const pass = this.valueMatcher.valuePassesFilter(value);
        return {
            message: `${this.valueMatcher.describeSelf(this.valueExtractor.describeSelf())}${(pass ? '' : '\x1b[31m<-- not true\x1b[37m')}`,
            pass: pass
        };
    }
}