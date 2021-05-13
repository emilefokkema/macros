class NodeFilterContext{
    constructor(node, getAll){
        this.node = node;
        this.style = getComputedStyle(node);
        this.rect = node.getBoundingClientRect();
        this.getAll = getAll;
    }
    getParent(){
        const parentNode = this.node.parentNode;
        if(!parentNode){
            return null;
        }
        return this.getAll().find(c => c.node === parentNode);
    }
}

class SelfAndAllParentsFilter{
    constructor(filter){
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
}

class SelfAndNoParentFilter{
    constructor(filter){
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
    constructor(...filters){
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
}

class IsInViewportFilter{
    nodePassesFilter(nodeContext){
        const rect = nodeContext.rect;
        return rect.x <= innerWidth && rect.x + rect.width >= 0 && rect.y <= innerHeight && rect.y + rect.height >= 0;
    }
}

class IntersectsRectFilter{
    constructor(rect){
        this.minX = rect.x;
        this.maxX = rect.x + rect.width;
        this.minY = rect.y;
        this.maxY = rect.y + rect.height;
    }
    nodePassesFilter(nodeContext){
        const otherRect = nodeContext.rect;
        return otherRect.x <= this.maxX && 
            otherRect.x + otherRect.width >= this.minX &&
            otherRect.y <= this.maxY &&
            otherRect.y + otherRect.height >= this.minY;
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

class ValueEqualsFilter{
    constructor(filterValue){
        this.filterValue = filterValue;
    }
    valuePassesFilter(value){
        return value === this.filterValue;
    }
}

class ValueIsNumberFilter{
    valuePassesFilter(value){
        return !isNaN(value);
    }
}

class ValueIsNumberGreaterThanFilter{
    constructor(threshold){
        this.threshold = threshold;
    }
    valuePassesFilter(value){
        if(isNaN(value)){
            return false;
        }
        const numberValue = parseFloat(value);
        return numberValue > this.threshold;
    }
}

class ParsesToIntFilter{
    constructor(intValue){
        this.intValue = intValue;
    }
    valuePassesFilter(value){
        return parseInt(value) === this.intValue;
    }
}

export class BlockedPageDiagnostic{
    diagnose(){
        const filter = new SelfAndNoParentFilter(new AndFilter(
            new StylePropertyFilter('z-index', new ValueIsNumberFilter()),
            new IsInViewportFilter(),
            new NotFilter(new StylePropertyFilter('position', new ValueEqualsFilter('relative'))),
            new SelfAndAllParentsFilter(new AndFilter(
                new NotFilter(new StylePropertyFilter('opacity', new ValueEqualsFilter('0'))),
                new NotFilter(new StylePropertyFilter('visibility', new ValueEqualsFilter('hidden'))),
                new NotFilter(new StylePropertyFilter('display', new ValueEqualsFilter('none'))),
                new NotFilter(new AndFilter(
                    new StylePropertyFilter('width', new ParsesToIntFilter(0)),
                    new StylePropertyFilter('height', new ParsesToIntFilter(0))
                ))
            ))
        ));
        const filterContexts = [].map.apply(document.querySelectorAll('*'), [n => new NodeFilterContext(n, () => filterContexts)]);
        const pass = filterContexts
            .filter(c => filter.nodePassesFilter(c))
            .filter((c, _, array) => {
                const zIndexNumber = parseFloat(c.style.getPropertyValue('z-index'));
                const rect = c.rect;
                const isBlockedByFilter = new AndFilter(
                    new StylePropertyFilter('z-index', new ValueIsNumberGreaterThanFilter(zIndexNumber)),
                    new IntersectsRectFilter(rect)
                );
                return !array.some(cc => cc !== c && isBlockedByFilter.nodePassesFilter(cc));
            })
            .map(c => c.node);
        //const pass = [].filter.apply(document.querySelectorAll('*'), [n => filter.nodePassesFilter(new NodeFilterContext(n))]);
        console.log(`pass:`, pass)
    }
}