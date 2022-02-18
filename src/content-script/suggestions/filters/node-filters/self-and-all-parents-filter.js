import { NodeFilter } from './node-filter';

export class SelfAndAllParentsFilter extends NodeFilter{
    constructor(filter){
        super();
        this.filter = filter;
    }
    nodePassesFilter(nodeContext){
        if(!this.filter.nodePassesFilter(nodeContext)){
            return false;
        }
        const parent = nodeContext.getParent();
        if(!parent){
            return true;
        }
        return this.nodePassesFilter(parent);
    }
    debugNodePassesFilter(nodeContext){
        const selfFilterDebugResult = this.filter.debugNodePassesFilter(nodeContext);
        if(!selfFilterDebugResult.pass){
            return {
                message: `selfAndAllParents(${selfFilterDebugResult.message})`,
                pass: false
            };
        }
        let parent = nodeContext;
        while(!!(parent = parent.getParent())){
            const parentFilterDebugResult = this.filter.debugNodePassesFilter(parent);
            if(!parentFilterDebugResult){
                return {
                    message: `selfAndAllParents(${selfFilterDebugResult.message} \x1b[31m(for some parent)\x1b[37m)`,
                    pass: false
                };
            }
        }
        return {
            message: `selfAndAllParents(...)`,
            pass: true
        };
    }
}