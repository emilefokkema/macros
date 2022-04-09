class SelectElement{
    constructor(element){
        this.element = element;
    }
    async selectOptionByText(text){
        const [optionElement] = await this.element.$x(`//option[text() = '${text}']`);
        const optionValue = await optionElement.evaluate(node => node.getAttribute('value'));
        await this.element.select(optionValue);
    }
}

module.exports = { SelectElement }