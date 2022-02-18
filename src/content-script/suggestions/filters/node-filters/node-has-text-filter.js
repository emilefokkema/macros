import { NodeFilter } from './node-filter';

export class NodeHasTextFilter extends NodeFilter{
    nodePassesFilter(nodeContext){
        for(let childNode of nodeContext.node.childNodes){
            if(childNode.nodeType !== Node.TEXT_NODE){
                continue;
            }
            if(/\S[\.,?;]\s+\S/.test(childNode.nodeValue)){
                return true;
            }
        }
        return false;
    }
}