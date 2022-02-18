import { NodeFilter } from './node-filter';

export class NotFilter extends NodeFilter{
    constructor(filter, description){
        super(description);
        this.filter = filter;
    }
    nodePassesFilter(nodeContext){
        return !this.filter.nodePassesFilter(nodeContext);
    }
    debugNodePassesFilter(nodeContext){
        const filterDebugResult = this.filter.debugNodePassesFilter(nodeContext);
        if(filterDebugResult.pass){
            return {
                message: `!(${filterDebugResult.message} \x1b[31m<-- is true\x1b[37m)`,
                pass: false
            };
        }
        return {
            message: ``,
            pass: true
        };
    }
}