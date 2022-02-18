export class IsSameAsOrParentOfMatcher{
    constructor(nodeContext){
        this.nodeContext = nodeContext;
        this.parents = undefined;
    }
    getParents(){
        if(!this.parents){
            this.parents = [];
            let parent = this.nodeContext;
            while(!!(parent = parent.getParent())){
                this.parents.push(parent);
            }
        }
        return this.parents;
    }
    valuePassesFilter(nodeContext){
        if(nodeContext === this.nodeContext){
            return true;
        }
        const parents = this.getParents();
        return parents.some(p => p === nodeContext);
    }
}