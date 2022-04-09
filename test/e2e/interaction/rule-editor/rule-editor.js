const { SelectAction } = require('./select-action');
const { ActionAdder } = require('./action-adder');
const { ErrorMessage } = require('../error-message');
const { InputElement } = require('../input-element');

class RuleEditor{
    constructor(page, frame){
        this.page = page;
        this.frame = frame;
        this.nameRequired = new ErrorMessage(frame, '[data-e2e=name-required-error]')
    }
    close(){
        return this.page.close();
    }
    async getNameInput(){
        const element = await this.frame.$('[data-e2e=name]');
        return new InputElement(element);
    }
    async waitForInputValue(selector){
        await this.frame.waitForFunction((selector) => {
            const el = document.querySelector(selector);
            return el && !!el.value;
        }, {}, selector);
        return await (await this.frame.$(selector)).evaluate(node => node.value);
    }
    async getActionAdder(){
        const element = await this.frame.waitForSelector('[data-e2e=action-adder]', {visible: true});
        return new ActionAdder(element);
    }
    async setName(value){
        await (await this.getNameInput()).setValue(value);
    }
    waitForName(){
        return this.waitForInputValue('[data-e2e=name]');
    }
    waitForUrlPattern(){
        return this.waitForInputValue('[data-e2e=url-pattern]');
    }
    async getAttachedPageUrl(){
        await this.frame.waitForFunction(() => {const el = document.querySelector('[data-e2e=page]');return el && el.innerText !== '{{url}}'});
        return await (await this.frame.$('[data-e2e=page]')).evaluate(node => node.innerText);
    }
    waitForFirstAction(){
        return this.frame.waitForSelector('[data-e2e=action]', {visible: true})
    }
    async getNumberOfActions(){
        const elements = await this.frame.$$('[data-e2e=action]');
        return elements.length;
    }
    async waitForSelectActionAtIndex(index){
        const element = await this.frame.waitForXPath(`//*[position()=${index + 1} and @data-e2e='action' and ./descendant-or-self::*[@data-e2e='select-action']]`);
        return new SelectAction(element);
    }
    async waitForSelectActions(){
        await this.waitForFirstAction();
        const elements = await this.frame.$x('//*[@data-e2e=\'action\' and ./descendant-or-self::*[@data-e2e=\'select-action\']]');
        return elements.map(e => new SelectAction(e));
    }
    async save(){
        const saveButton = await this.frame.$('[data-e2e=save]');
        await saveButton.click();
    }
    bringToFront(){
        return this.page.bringToFront();
    }
}

module.exports = { RuleEditor }