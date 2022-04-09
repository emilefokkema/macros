const { Rule } = require('./rule');

class RuleList{
    constructor(element){
        this.element = element;
    }
    whenNotLoading(){
        return this.element.waitForSelector('[data-e2e=loading-rules]', {hidden: true})
    }
    async waitForFirstRule(){
        const element = await this.element.waitForSelector('[data-e2e=rule]', {visible: true});
        return new Rule(element);
    }
    async waitForDraftRule(){
        const element = await this.element.waitForSelector('[data-e2e=draft-rule]', {visible: true});
        return new Rule(element);
    }
    async getDraftRule(){
        const element = await this.element.$('[data-e2e=draft-rule]');
        if(!element){
            return null;
        }
        return new Rule(element);
    }
    whenDraftRuleGone(){
        return this.element.waitForSelector('[data-e2e=draft-rule]', {hidden: true});
    }
    async getRules(){
        const elements = await this.element.$$('[data-e2e=rule]');
        return elements.map(e => new Rule(e));
    }
    async getRulesByName(name){
        const elements = await this.element.$x(`//*[@data-e2e='rule' and ./descendant-or-self::*[@data-e2e = 'name' and text() = '${name}']]`);
        return elements.map(e => new Rule(e))
    }
    async dragOverNoRulesMessage(dragData){
        const noRulesElement = await this.element.$('[data-e2e=no-rules]');
        await noRulesElement.dragEnter(dragData);
        await noRulesElement.dragOver(dragData);
    }
    async dropOnNoRulesMessage(dragData){
        const noRulesElement = await this.element.$('[data-e2e=no-rules]');
        await noRulesElement.drop(dragData);
    }
    async getNewRule(){
        const newRuleElement = await this.element.waitForSelector('[data-e2e=new-rule]', {visible: true});
        return new Rule(newRuleElement);
    }
}

module.exports = { RuleList };