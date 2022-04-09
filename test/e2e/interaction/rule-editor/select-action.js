const { Action } = require('./action');
const { ClassRemovingNodeAction } = require('./class-removing-node-action');
const { ErrorMessage } = require('../error-message');
const { InputElement } = require('../input-element');

class SelectAction extends Action{
    constructor(element){
        super(element);
        this.selectorRequired = new ErrorMessage(element, '[data-e2e=selector-required-error]');
        this.selectorInvalid = new ErrorMessage(element, '[data-e2e=selector-invalid-error]');
        this.actionRequired = new ErrorMessage(element, '[data-e2e=action-required-error]');
    }
    async setNodeActionType(type){
        const actionTypeSelector = await this.element.$('[data-e2e=node-action]');
        await actionTypeSelector.select(type);
    }
    async getNodeActionType(){
        const actionTypeSelector = await this.element.$('[data-e2e=node-action]');
        return await actionTypeSelector.evaluate((node) => node.value);
    }
    async getSelectorInput(){
        const element = await this.element.$('[data-e2e=selector]');
        return new InputElement(element);
    }
    async setSelectorValue(value){
        await (await this.getSelectorInput()).setValue(value);
    }
    async getSelectorValue(){
        return await (await this.getSelectorInput()).getValue();
    }
    async getClassRemovingNodeAction(){
        if(await this.getNodeActionType() !== 'removeClass'){
            return null;
        }
        const [removeClassElement] = await this.element.$x(`//*[contains(@data-e2e, 'removeClass')]`);
        return new ClassRemovingNodeAction(removeClassElement);
    }
    createDeletingNodeAction(){
        return this.setNodeActionType('delete');
    }
    async getDeletingNodeAction(){
        if(await this.getNodeActionType() !== 'delete'){
            return false;
        }
        return true;
    }
}

module.exports = { SelectAction };