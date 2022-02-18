import { JoinFilter } from "./join-filter";
import { AndFilter } from '../../node-filters/and-filter';

export class AndJoinFilter extends JoinFilter{
    constructor(one, other){
        super();
        this.one = one;
        this.other = other;
    }
    getRightFilter(left){
        const oneRightFilter = this.one.getRightFilter(left);
        const otherRightFilter = this.other.getRightFilter(left);
        return new AndFilter([oneRightFilter, otherRightFilter]);
    }
}