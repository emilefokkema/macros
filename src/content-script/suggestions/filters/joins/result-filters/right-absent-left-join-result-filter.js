import { LeftJoinResultFilter } from "./left-join-result-filter";

export class RightAbsentLeftJoinResultFilter extends LeftJoinResultFilter{
    allowsRightPresent(){
        return false;
    }
}