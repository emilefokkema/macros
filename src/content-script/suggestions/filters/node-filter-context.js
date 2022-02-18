import { JoinDataProvider } from './joins/join-data-provider';
import { JoinFilterBuilder } from './joins/filters/builders/join-filter-builder';
import { NodeFilterBuilder } from './node-filters/builders/node-filter-builder';
import { LeftJoinCombinator } from './joins/left-join-combinator';
import { JoinCombinator } from './joins/join-combinator';

class NodeFilterContextListQuery{

    executeInternal(list){
        return list;
    }

    *execute(list){
        for(let element of this.executeInternal(list)){
            yield element.node;
        }
    }

    debugPresenceOfElement(element, list){
        return list.debugPresenceOfElement(element);
    }

    static create(queryBuilderAction){
        const builder = queryBuilderAction(new NodeFilterContextQueryBuilder());
        return builder.build();
    }
}

class DistinctNodeFilterContextListQuery extends NodeFilterContextListQuery{
    constructor(previous){
        super();
        this.previous = previous;
    }
    *executeInternal(list){
        const alreadySeen = [];
        for(let element of this.previous.executeInternal(list)){
            if(alreadySeen.includes(element)){
                continue;
            }
            alreadySeen.push(element);
            yield element;
        }
    }
}

class FilteringNodeFilterContextListQuery extends NodeFilterContextListQuery{
    constructor(previous, nodeFilter){
        super();
        this.previous = previous;
        this.nodeFilter = nodeFilter;
    }
    debugPresenceOfElement(element, list){
        const previousResult = this.previous.debugPresenceOfElement(element, list);
        if(!previousResult.present){
            return {
                message: `${previousResult.message}.where(...)`,
                present: false
            };
        }
        const filterDebugResult = this.nodeFilter.debugNodePassesFilter(previousResult.present);
        if(!filterDebugResult.pass){
            return {
                message: `where(x => ${filterDebugResult.message})`,
                present: false
            };
        }
        return {
            message: `where(...)`,
            present: previousResult.present
        };
    }
    *executeInternal(list){
        for(let element of this.previous.executeInternal(list)){
            if(this.nodeFilter.nodePassesFilter(element)){
                yield element;
            }
        }
    }
}

class JoiningNodeFilterContextListQuery{
    constructor(ones, others, combinator, methodName){
        this.ones = ones;
        this.others = others;
        this.combinator = combinator;
        this.methodName = methodName;
    }
    debugPresenceOfElementLeft(element, list){
        return this.combinator.debugPresenceOfElementLeft(this.ones, this.others, this.methodName, element, list);
    }
    debugPresenceOfElementRight(element, list){
        return this.combinator.debugPresenceOfElementRight(this.ones, this.others, this.methodName, element, list);
    }
    execute(list){
        return this.combinator.execute(this.ones, this.others, list);
    }
}

class RightNodeSelectingQuery extends NodeFilterContextListQuery{
    constructor(joiningListQuery){
        super();
        this.joiningListQuery = joiningListQuery;
    }
    debugPresenceOfElement(element, list){
        const queryContainsElementRightResult = this.joiningListQuery.debugPresenceOfElementRight(element, list);
        let message = `${queryContainsElementRightResult.message}.selectRight()`
        return {
            message: message,
            present: queryContainsElementRightResult.present
        }
    }
    *executeInternal(list){
        for(let combination of this.joiningListQuery.execute(list)){
            yield combination.right;
        }
    }
}

class LeftNodeSelectingQuery extends NodeFilterContextListQuery{
    constructor(joiningListQuery){
        super();
        this.joiningListQuery = joiningListQuery;
    }
    debugPresenceOfElement(element, list){
        const queryContainsElementLeftResult = this.joiningListQuery.debugPresenceOfElementLeft(element, list);
        let message = `${queryContainsElementLeftResult.message}.selectLeft()`
        return {
            message: message,
            present: queryContainsElementLeftResult.present
        }
    }
    *executeInternal(list){
        for(let combination of this.joiningListQuery.execute(list)){
            yield combination.left;
        }
    }
}

class CompleteNodeFilterContextList {
    constructor(filterContexts){
        this.filterContexts = filterContexts;
    }
    getForNode(node){
        return this.filterContexts.find(c => c.node === node);
    }
    debugPresenceOfElement(element){
        return {
            message: ``,
            present: this.getForNode(element)
        };
    }
    [Symbol.iterator](){
        return this.filterContexts[Symbol.iterator]();
    }
    static create(){
        const filterContexts = [];
        const result = new CompleteNodeFilterContextList(filterContexts);
        for(let node of document.querySelectorAll('*')){
            const context = new NodeFilterContext(node, result);
            filterContexts.push(context);
        }
        return result;
    }
}

class NodeFilterContext{
    constructor(node, repository){
        this.list = null;
        this.node = node;
        this._style = null;
        this._rect = null;
        this._parent = null;
        this.repository = repository;
    }
    get rect(){
        if(this._rect === null){
            this._rect = this.node.getBoundingClientRect();
        }
        return this._rect;
    }
    get nodeName(){
        return this.node.nodeName;
    }
    get style(){
        if(this._style === null){
            this._style = getComputedStyle(this.node);
        }
        return this._style;
    }
    getParent(){
        if(this._parent === null && !!this.node.parentNode && this.node.parentNode !== document){
            this._parent = this.repository.getForNode(this.node.parentNode);
        }
        return this._parent;
    }
    static getAll(){
        return CompleteNodeFilterContextList.create();
    }
}

class NodeFilterContextJoiningQueryBuilder{
    constructor(ones, others, combinator, methodName){
        this.ones = ones;
        this.others = others;
        this.combinator = combinator;
        this.methodName = methodName;
    }
    build(){
        return new JoiningNodeFilterContextListQuery(this.ones, this.others, this.combinator, this.methodName);
    }
    where(resultFilterBuilderAction){
        const newCombinator = this.combinator.where(resultFilterBuilderAction);
        return new NodeFilterContextJoiningQueryBuilder(this.ones, this.others, newCombinator, this.methodName);
    }
    selectLeft(){
        return new NodeFilterContextQueryBuilder(new LeftNodeSelectingQuery(this.build()))
    }
    selectRight(){
        return new NodeFilterContextQueryBuilder(new RightNodeSelectingQuery(this.build()))
    }
}

class NodeFilterContextQueryBuilder{
    constructor(current){
        this.current = current || new NodeFilterContextListQuery();
    }
    build(){
        return this.current;
    }
    where(filterBuilderAction){
        const builder = filterBuilderAction(new NodeFilterBuilder());
        const nodeFilter = builder.build();
        return new NodeFilterContextQueryBuilder(new FilteringNodeFilterContextListQuery(this.current, nodeFilter));
    }
    distinct(){
        return new NodeFilterContextQueryBuilder(new DistinctNodeFilterContextListQuery(this.current));
    }
    leftJoinSelf(joinFilterBuilderAction){
        const joinDataProvider = new JoinDataProvider();
        let joinFilterBuilder = new JoinFilterBuilder();
        joinFilterBuilder = joinFilterBuilderAction(joinDataProvider, joinFilterBuilder);
        const joinFilter = joinFilterBuilder.build();
        const combinator = new LeftJoinCombinator(joinFilter);
        return new NodeFilterContextJoiningQueryBuilder(this.current, this.current, combinator, 'leftJoinSelf');
    }
    join(queryBuilderAction, joinFilterBuilderAction){
        const others = NodeFilterContextListQuery.create(queryBuilderAction);
        const joinDataProvider = new JoinDataProvider();
        let joinFilterBuilder = new JoinFilterBuilder();
        joinFilterBuilder = joinFilterBuilderAction(joinDataProvider, joinFilterBuilder);
        const joinFilter = joinFilterBuilder.build();
        return new NodeFilterContextJoiningQueryBuilder(this.current, others, new JoinCombinator(joinFilter), 'join');
    }
}

export {NodeFilterContextListQuery, NodeFilterContext };

