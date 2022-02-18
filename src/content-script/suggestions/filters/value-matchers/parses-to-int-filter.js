export class ParsesToIntFilter{
    constructor(intValue){
        this.intValue = intValue;
    }
    valuePassesFilter(value){
        return parseInt(value) === this.intValue;
    }
    describeSelf(value){
        return `${value} is integer`
    }
}