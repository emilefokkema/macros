import { NodeFilter } from './node-filter';
import { SelfAndAllParentsFilter } from './self-and-all-parents-filter';
import { NotFilter } from './not-filter';

export class SelfAndNoParentFilter extends NodeFilter{
    constructor(filter, description){
        super(description);
        this.filter = filter;
        this.allParentsFilter = new SelfAndAllParentsFilter(new NotFilter(filter));
    }
    nodePassesFilter(nodeContext){
        if(!this.filter.nodePassesFilter(nodeContext)){
            return false;
        }
        const parent = nodeContext.getParent();
        if(!parent){
            return true;
        }
        return this.allParentsFilter.nodePassesFilter(parent);
    }
    debugNodePassesFilter(nodeContext){
        const filterDebugResult = this.filter.debugNodePassesFilter(nodeContext);
        if(!filterDebugResult.pass){
            return {
                message: `selfAndNoParent(${filterDebugResult.message})`,
                pass: false
            };
        }
        let parent = nodeContext;
        while(!!(parent = parent.getParent())){
            const parentFilterDebugResult = this.filter.debugNodePassesFilter(parent);
            if(parentFilterDebugResult.pass){
                return {
                    message: `selfAndNoParent(... \x1b[31m(true for some parent)\x1b[37m)`,
                    pass: false
                };
            }
        }
        return {
            message: `selfAndNoParent(...)`,
            pass: true
        };
    }
}