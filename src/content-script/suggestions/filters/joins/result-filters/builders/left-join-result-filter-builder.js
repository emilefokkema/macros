import { LeftJoinResultFilter } from "../left-join-result-filter";
import { RightAbsentLeftJoinResultFilter } from '../right-absent-left-join-result-filter';

export class LeftJoinResultFilterBuilder{
    constructor(current){
        this.current = current || new LeftJoinResultFilter();
    }
    build(){
        return this.current;
    }
    absent(){
        return new LeftJoinResultFilterBuilder(new RightAbsentLeftJoinResultFilter());
    }
}