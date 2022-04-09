class Action{
    constructor(element){
        this.element = element;
    }
    whenExecutable(){
        return this.element.waitForSelector('[data-e2e=execute]', {visible: true})
    }
    whenNotExecutable(){
        return this.element.waitForSelector('[data-e2e=execute]', {hidden: true})
    }
    async execute(){
        const executeButton = await this.element.$('[data-e2e=execute]');
        return await executeButton.click();
    }
}

module.exports = { Action }