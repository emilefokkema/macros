class ClassRemovingNodeAction{
    constructor(element){
        this.element = element;
    }
    async getClassName(){
        const [classNameElement] = await this.element.$x(`descendant-or-self::*[contains(@data-e2e, 'className')]`);
        return await classNameElement.evaluate((node) => node.value);
    }
}

module.exports = { ClassRemovingNodeAction }