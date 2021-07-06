import { ruleDefinitions } from '../../shared/rule-definitions';

class Logger{
    constructor(parentLogger, numberOfIndents, scopeId, newScopeId){
        this.scopeId = scopeId;
        this.parentLogger = parentLogger;
        this.numberOfIndents = numberOfIndents;
        this.padding = Array.apply(null, new Array(numberOfIndents)).map(x => `  `).join('');
        this.newScopeId = newScopeId;
    }
    log(message, nodeContext){
        message = `${this.padding}[${this.scopeId}] ${message}`;
        console.log(message, '(some node context)');
    }
    getNewScopeId(){
        if(this.parentLogger){
            return this.parentLogger.getNewScopeId();
        }
        return this.newScopeId++;
    }
    forNewScope(){
        return new Logger(this, this.numberOfIndents + 1, this.getNewScopeId(), undefined);
    }
    static create(){
        return new Logger(undefined, 0, 0, 1);
    }
}

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

class NodeFilter{
    constructor(description){
        this.description = description;
    }
    describeSelf(){
        return `filter`;
    }
    toString(){
        return this.description || this.describeSelf();
    }
}

class SelfAndAllParentsFilter extends NodeFilter{
    constructor(filter, description){
        super(description);
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
    debugNodePassesFilter(nodeContext, logger){
        if(!this.filter.debugNodePassesFilter(nodeContext, logger.forNewScope())){
            logger.log(`node does not itself pass: (${this.filter}):`, nodeContext)
            return false;
        }
        const parent = nodeContext.getParent();
        if(!parent){
            logger.log(`has no parent, so self and all parents pass (${this.filter})`, nodeContext);
            return true;
        }
        const parentResult = this.debugNodePassesFilter(parent, logger.forNewScope());
        if(!parentResult){
            logger.log(`parent does not pass (${this.filter}): `, parent)
        }else{
            logger.log(`all parents pass (${this.filter})`, parent)
        }
        return parentResult;
    }
    describeSelf(){
        return `for self and all parents: (${this.filter})`;
    }
}

class SelfAndNoParentFilter extends NodeFilter{
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
    debugNodePassesFilter(nodeContext, logger){
        if(!this.filter.debugNodePassesFilter(nodeContext, logger.forNewScope())){
            logger.log(`node does not itself pass: (${this.filter}):`, nodeContext)
            return false;
        }
        const parent = nodeContext.getParent();
        if(!parent){
            logger.log(`has no parent, so self and no parent passes (${this.filter})`, nodeContext)
            return true;
        }
        const allParentsResult = this.allParentsFilter.debugNodePassesFilter(parent, logger.forNewScope());
        if(!allParentsResult){
            logger.log(`node has some parent that does match (${this.filter}):`, nodeContext)
        }
        return allParentsResult;
    }
    describeSelf(){
        return `for self but for no parent: (${this.filter})`;
    }
}

class NotFilter extends NodeFilter{
    constructor(filter, description){
        super(description);
        this.filter = filter;
    }
    nodePassesFilter(nodeContext){
        return !this.filter.nodePassesFilter(nodeContext);
    }
    debugNodePassesFilter(nodeContext, logger){
        const result = !this.filter.debugNodePassesFilter(nodeContext, logger.forNewScope());
        if(!result){
            logger.log(`node does pass (${this.filter}):`, nodeContext)
        }
        return result;
    }
    describeSelf(){
        return `not: (${this.filter})`;
    }
}

class AndFilter extends NodeFilter{
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
    debugNodePassesFilter(nodeContext, logger){
        for(const filter of this.filters){
            if(!filter.debugNodePassesFilter(nodeContext, logger.forNewScope())){
                logger.log(`node does not match (${filter}): `, nodeContext)
                return false;
            }
        }
        return true;
    }
    describeSelf(){
        return this.filters.map(f => `(${f})`).join(' & ');
    }
}

class IsInViewportFilter extends NodeFilter{
    nodePassesFilter(nodeContext){
        const rect = nodeContext.rect;
        return rect.x <= innerWidth && rect.x + rect.width >= 0 && rect.y <= innerHeight && rect.y + rect.height >= 0;
    }
    debugNodePassesFilter(nodeContext, logger){
        const rect = nodeContext.rect;
        const result = rect.x <= innerWidth && rect.x + rect.width >= 0 && rect.y <= innerHeight && rect.y + rect.height >= 0;
        if(!result){
            logger.log(`element is not in viewport: `, nodeContext)
        }
        return result;
    }
    describeSelf(){
        return `is in viewport`;
    }
}

class IntersectsRectFilter extends NodeFilter{
    constructor(rect){
        super();
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
    debugNodePassesFilter(nodeContext, logger){
        const otherRect = nodeContext.rect;
        const result = otherRect.x <= this.maxX && 
            otherRect.x + otherRect.width >= this.minX &&
            otherRect.y <= this.maxY &&
            otherRect.y + otherRect.height >= this.minY;
        if(!result){
            logger.log(`rectangle does not intersect rectangle [${this.minX}, ${this.maxX}] x [${this.minY}, ${this.maxY}]:`, otherRect)
        }
        return result;
    }
    describeSelf(){
        return `intersects rectangle [${this.minX}, ${this.maxX}] x [${this.minY}, ${this.maxY}]`;
    }
}

class StylePropertyFilter extends NodeFilter{
    constructor(property, valueMatcher, description){
        super(description);
        this.property = property;
        this.valueMatcher = valueMatcher;
    }
    nodePassesFilter(nodeContext){
        const value = nodeContext.style.getPropertyValue(this.property);
        return this.valueMatcher.valuePassesFilter(value);
    }
    debugNodePassesFilter(nodeContext, logger){
        const value = nodeContext.style.getPropertyValue(this.property);
        const result = this.valueMatcher.valuePassesFilter(value);
        if(!result){
            logger.log(`property '${this.property}' does not match (${this.valueMatcher}):`, nodeContext)
        }
        return result;
    }
    describeSelf(){
        return `property '${this.property}' matches: (${this.valueMatcher})`;
    }
}

class ValueEqualsFilter{
    constructor(filterValue){
        this.filterValue = filterValue;
    }
    valuePassesFilter(value){
        return value === this.filterValue;
    }
    toString(){
        return `value equals ${this.filterValue}`
    }
}

class ValueIsNumberFilter{
    valuePassesFilter(value){
        return !isNaN(value);
    }
    toString(){
        return `value is a number`;
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
    toString(){
        return `value > ${this.threshold}`
    }
}

class ParsesToIntFilter{
    constructor(intValue){
        this.intValue = intValue;
    }
    valuePassesFilter(value){
        return parseInt(value) === this.intValue;
    }
    toString(){
        return `is integer ${this.intValue}`
    }
}

export class BlockedPageSuggestionProvider{
    constructor(){
        this.firstFilter = new SelfAndNoParentFilter(new AndFilter([
            new StylePropertyFilter('z-index', new ValueIsNumberFilter(), 'has z-index'),
            new IsInViewportFilter(),
            new NotFilter(new StylePropertyFilter('position', new ValueEqualsFilter('relative')), 'has non-relative position'),
            new SelfAndAllParentsFilter(new AndFilter([
                new NotFilter(new StylePropertyFilter('opacity', new ValueEqualsFilter('0'))),
                new NotFilter(new StylePropertyFilter('visibility', new ValueEqualsFilter('hidden'))),
                new NotFilter(new StylePropertyFilter('display', new ValueEqualsFilter('none'))),
                new NotFilter(new AndFilter([
                    new StylePropertyFilter('width', new ParsesToIntFilter(0)),
                    new StylePropertyFilter('height', new ParsesToIntFilter(0))]
                ))]
            ), 'has size and is visible')]
        ));
    }
    debugSuggestionForElement(element){
        console.log(`BlockedPageSuggestionProvider checking whether element passes ${this.firstFilter}:`, element);
        const filterContexts = [].map.apply(document.querySelectorAll('*'), [n => new NodeFilterContext(n, () => filterContexts)]);
        const contextForElement = filterContexts.find(c => c.node === element);
        const logger = Logger.create();
        const result = this.firstFilter.debugNodePassesFilter(contextForElement, logger);
        console.log(`BlockedPageSuggestionProvider concluded that element does${result ? '':' not'} pass the first filter`)
    }
    createSuggestions(suggestionCollection){
        const filterContexts = [].map.apply(document.querySelectorAll('*'), [n => new NodeFilterContext(n, () => filterContexts)]);
        const firstPass = filterContexts.filter(c => this.firstFilter.nodePassesFilter(c));
        const pass = firstPass
            .filter((c, _, array) => {
                const zIndexNumber = parseFloat(c.style.getPropertyValue('z-index'));
                const rect = c.rect;
                const isBlockedByFilter = new AndFilter([
                    new StylePropertyFilter('z-index', new ValueIsNumberGreaterThanFilter(zIndexNumber)),
                    new IntersectsRectFilter(rect)]
                );
                const isBlockedByOther = array.some(cc => cc !== c && isBlockedByFilter.nodePassesFilter(cc));
                return !isBlockedByOther;
            })
            .map(c => c.node);
        
        for(const passedNode of pass){
            suggestionCollection.addNodeActionSuggestion(passedNode, ruleDefinitions.getDeleteActionDefinition());
        }
    }
}