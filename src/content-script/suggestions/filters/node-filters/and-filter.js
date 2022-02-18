import { NodeFilter } from './node-filter';

export class AndFilter extends NodeFilter{
    constructor(filters, description){
        super(description);
        this.filters = filters;
    }
    nodePassesFilter(nodeContext){
        for(const filter of this.filters){
            if(!filter.nodePassesFilter(nodeContext)){
                return false;
            }
        }
        return true;
    }
    debugNodePassesFilter(nodeContext){
        for(let filter of this.filters){
            const filterDebugResult = filter.debugNodePassesFilter(nodeContext);
            if(!filterDebugResult.pass){
                return filterDebugResult;
            }
        }
        return {
            message: ``,
            pass: true
        };
    }
}