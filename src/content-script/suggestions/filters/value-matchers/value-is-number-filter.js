export class ValueIsNumberFilter{
    valuePassesFilter(value){
        return value !== '' && !isNaN(value);
    }
    describeSelf(value){
        return `${value} is a number`
    }
}