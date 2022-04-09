class Suggestion{
    constructor(element){
        this.element = element;
    }
    async execute(){
        const executeButton = await this.element.$('[data-e2e=execute-suggestion]');
        await executeButton.click();
        await this.element.waitForSelector('[data-e2e=undo-suggestion]', {visible: true})
    }
    async undo(){
        const undoButton = await this.element.$('[data-e2e=undo-suggestion]');
        await undoButton.click();
        await this.element.waitForSelector('[data-e2e=execute-suggestion]', {visible: true})
    }
    async beginDragging(){
        const dragStartElement = await this.element.$('[data-e2e=drag-start]');
        const box = await dragStartElement.boundingBox();
        return await this.element.drag({x: box.x + box.width / 2, y: box.y + box.height / 2});
    }
}

module.exports = { Suggestion };