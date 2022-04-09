class Rule{
    constructor(element){
        this.element = element;
    }
    async addAction(){
        const buttonElement = await this.element.$('[data-e2e=add-action]');
        await buttonElement.click();
    }
    async waitForEffectDescription(descriptionText){
        const effectElement = await this.element.$('[data-e2e=effect-description]');
        let description;
        while((description = await effectElement.evaluate((node) => node.innerText)) !== descriptionText){
            await new Promise(res => setTimeout(res, 20))
        }
    }
}

module.exports = { Rule }