const { Rule } = require('./rule');

class DevtoolsSidebar{
    constructor(frame){
        this.frame = frame;
    }
    waitForSelectorDisplayWithText(text){
        return this.frame.waitForFunction((text) => {
            const element = document.querySelector('[data-e2e=selector]');
            return !!element && element.innerText === text;
        }, {}, text)
    }
    waitForSelectorDisplay(){
        return this.frame.waitForSelector('[data-e2e=selector]', {visible: true});
    }
    async waitForRuleByName(name){
        const element = await this.frame.waitForXPath(`//*[@data-e2e = "rule" and ./descendant-or-self::*[@data-e2e = "name" and text() = "${name}"]]`, {visible: true});
        return new Rule(element);
    }
    async waitForNewRule(){
        const element = await this.frame.waitForSelector('[data-e2e=new-rule]', {visible: true});
        return new Rule(element);
    }
    async waitForDraftRule(){
        const element = await this.frame.waitForSelector('[data-e2e=draft-rule]', {visible: true});
        return new Rule(element);
    }
}

module.exports = { DevtoolsSidebar };