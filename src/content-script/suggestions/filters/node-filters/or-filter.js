import { NodeFilter } from './node-filter';

export class OrFilter extends NodeFilter{
    constructor(filters, description){
        super(description);
        this.filters = filters;
    }
    nodePassesFilter(nodeContext){
        for(const filter of this.filters){
            if(filter.nodePassesFilter(nodeContext)){
                return true;
            }
        }
        return false;
    }
    debugNodePassesFilter(nodeContext){
        const filterDebugResults = this.filters.map(f => f.debugNodePassesFilter(nodeContext));
        if(filterDebugResults.some(r => r.pass)){
            return {
                message: ``,
                pass: true
            };
        }
        return {
            message: filterDebugResults.map(r => `${r.message} \x1b[31m<-- is not true\x1b[37m`).join(' | '),
            pass: false
        };
    }
}