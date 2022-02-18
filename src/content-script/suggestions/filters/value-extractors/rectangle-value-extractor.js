export class RectangleValueExtractor{
    describeSelf(){
        return 'rect';
    }
    getValue(nodeContext){
        return nodeContext.rect;
    }
}