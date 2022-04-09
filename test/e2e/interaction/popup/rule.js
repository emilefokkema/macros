class Rule{
    constructor(element){
        this.element = element;
    }
    async drop(dragData){
        await this.element.dragEnter(dragData);
        await this.element.dragOver(dragData);
        await this.element.drop(dragData);
    }
    async getName(){
        const nameElement = await this.element.$('[data-e2e=name]');
        return await nameElement.evaluate(node => node.firstChild.data);
    }
    async edit(){
        return await (await this.element.$('[data-e2e=edit]')).click();
    }
    whenEditable(){
        return this.element.waitForSelector('[data-e2e=edit]', {visible: true})
    }
    whenNotEditable(){
        return this.element.waitForSelector('[data-e2e=edit]', {hidden: true})
    }
    async execute(){
        return await Promise.all([
            (await this.element.$('[data-e2e=execute]')).click(),
            this.element.waitForSelector('[data-e2e=has-executed]', {visible: true})
        ])
    }
    whenExecutable(){
        return this.element.waitForSelector('[data-e2e=execute]', {visible: true});
    }
    whenNotExecutable(){
        return this.element.waitForSelector('[data-e2e=execute]', {hidden: true});
    }
}

module.exports = { Rule }