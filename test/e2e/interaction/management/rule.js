class Rule{
    constructor(element){
        this.element = element;
    }
    whenDeletable(){
        return this.element.waitForSelector('[data-e2e=delete]', {visible: true});
    }
    whenNotDeletable(){
        return this.element.waitForSelector('[data-e2e=delete]', {hidden: true});
    }
    async edit(){
        const editButton = await this.element.$('[data-e2e=edit]');
        await editButton.click();
    }
}

module.exports = { Rule }