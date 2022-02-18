export class ValueEqualsFilter{
    constructor(filterValue){
        this.filterValue = filterValue;
    }
    valuePassesFilter(value){
        return value === this.filterValue;
    }
    describeSelf(value){
        return `${value} = ${this.filterValue}`
    }
}