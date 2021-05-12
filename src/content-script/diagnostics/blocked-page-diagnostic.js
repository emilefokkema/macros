class NodeFilterContext{
    constructor(node){
        this.style = getComputedStyle(node);
    }
}

class NotFilter{
    constructor(filter){
        this.filter = filter;
    }
    nodePassesFilter(nodeContext){
        return !this.filter.nodePassesFilter(nodeContext);
    }
}

class AndFilter{
    constructor(filter1, filter2){
        this.filter1 = filter1;
        this.filter2 = filter2;
    }
    nodePassesFilter(nodeContext){
        return this.filter1.nodePassesFilter(nodeContext) && this.filter2.nodePassesFilter(nodeContext);
    }
}

class StylePropertyFilter{
    constructor(property, valueMatcher){
        this.property = property;
        this.valueMatcher = valueMatcher;
    }
    nodePassesFilter(nodeContext){
        const value = nodeContext.style.getPropertyValue(this.property);
        return this.valueMatcher.valuePassesFilter(value);
    }
}

class StringValueFilter{
    constructor(filterValue){
        this.filterValue = filterValue;
    }
    valuePassesFilter(value){
        return value === this.filterValue;
    }
}

export class BlockedPageDiagnostic{
    diagnose(){
        const filter = new AndFilter(
            new StylePropertyFilter('position', new StringValueFilter('fixed')),
            new NotFilter(new StylePropertyFilter('visibility', new StringValueFilter('hidden')))
        );
        const pass = [].filter.apply(document.querySelectorAll('*'), [n => filter.nodePassesFilter(new NodeFilterContext(n))]);
        console.log(`pass:`, pass)
    }
}