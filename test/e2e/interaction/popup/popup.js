const { SuggestionList } = require('./suggestion-list');
const { RuleList } = require('./rule-list');
const { SelectElement } = require('../select-element');

class Popup{
    constructor(page, frame){
        this.page = page;
        this.frame = frame;
    }
    close(){
        return this.page.close();
    }
    bringToFront(){
        return this.page.bringToFront();
    }
    async getNavigationSelector(){
        const element = await this.frame.waitForSelector('[data-e2e=navigation-selector]');
        return new SelectElement(element);
    }
    async addRule(){
        const addRuleButton = await this.frame.$('[data-e2e=add-rule]');
        return await addRuleButton.click();
    }
    async goToManagementPage(){
        const managementPageButton = await this.frame.$('[data-e2e=management]');
        return await managementPageButton.click();
    }
    async waitForRuleList(){
        const element = await this.frame.waitForSelector('[data-e2e=rule-list]');
        return new RuleList(element);
    }
    async waitForSuggestionList(){
        const element = await this.frame.waitForSelector('[data-e2e=suggestion-list]');
        return new SuggestionList(element, this.frame);
    }
}

module.exports = { Popup }