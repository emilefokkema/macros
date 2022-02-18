export class ValueIsNumberGreaterThanFilter{
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
    describeSelf(value){
        return `${value} > ${this.threshold}`
    }
}