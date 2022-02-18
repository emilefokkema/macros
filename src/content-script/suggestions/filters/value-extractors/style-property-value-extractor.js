export class StylePropertyValueExtractor{
    constructor(propertyName){
        this.propertyName = propertyName;
    }
    getValue(nodeContext){
        return nodeContext.style.getPropertyValue(this.propertyName);
    }
    describeSelf(){
        return `style('${this.propertyName}')`
    }
}