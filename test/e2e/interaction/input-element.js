class InputElement{
    constructor(element){
        this.element = element;
    }
    getValue(){
        return this.element.evaluate(node => node.value)
    }
    async setValue(value){
        await this.element.focus();
        if(value){
            await this.element.evaluate(node => node.value = '');
            await this.element.type(value);
        }else{
            await this.element.evaluate(node => node.value = 'a');
            await this.element.press('Backspace')
        }
    }
}

module.exports = { InputElement }