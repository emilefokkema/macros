import { NodeFilter } from '../../node-filters/node-filter';

export class JoinFilter{
    getRightFilter(left){
        return new NodeFilter();
    }
}