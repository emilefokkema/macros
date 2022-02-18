import { NodeFilter } from './node-filter';

export class NodeNameIsOneOfFilter extends NodeFilter{
    constructor(nodeNames){
        super();
        this.nodeNames = nodeNames.map(n => n.toLowerCase());
    }
    nodePassesFilter(nodeContext){
        const lowerNodeName = nodeContext.nodeName.toLowerCase();
        return this.nodeNames.some(n => n === lowerNodeName);
    }
}