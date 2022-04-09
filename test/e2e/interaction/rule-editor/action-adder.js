class ActionAdder{
    constructor(element){
        this.element = element;
    }
    async chooseSelectAction(){
        const selectElement = await this.element.$('[data-e2e=action-type]');
        await selectElement.select('select');
    }
    async addAction(){
        const addActionElement = await this.element.$('[data-e2e=add-action]');
        return await addActionElement.click();
    }
}

module.exports = { ActionAdder }