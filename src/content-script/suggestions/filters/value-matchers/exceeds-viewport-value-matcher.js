export class ExceedsViewportValueMatcher{
    valuePassesFilter(rect){
        return rect.x < innerWidth && 
               rect.x + rect.width > 0 &&
               rect.y < innerHeight && 
               rect.y + rect.height > 0 &&
               (rect.x + rect.width > innerWidth || rect.x < 0 || rect.y + rect.height > innerHeight || rect.y < 0);
    }
    describeSelf(value){
        return `exceedsViewport(${value})`
    }
}