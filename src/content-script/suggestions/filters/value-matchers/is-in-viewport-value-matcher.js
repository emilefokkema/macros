export class IsInViewportValueMatcher{
    valuePassesFilter(rect){
        return rect.x <= innerWidth && rect.x + rect.width >= 0 && rect.y <= innerHeight && rect.y + rect.height >= 0;
    }
    describeSelf(value){
        return `isInViewport(${value})`
    }
}