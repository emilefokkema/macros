export class IntersectsRectValueMatcher{
    constructor(rect){
        this.minX = rect.x;
        this.maxX = rect.x + rect.width;
        this.minY = rect.y;
        this.maxY = rect.y + rect.height;
    }
    valuePassesFilter(rect){
        return rect.x <= this.maxX && 
            rect.x + rect.width >= this.minX &&
            rect.y <= this.maxY &&
            rect.y + rect.height >= this.minY;
    }
    describeSelf(value){
        return `intersects(${value})`
    }
}