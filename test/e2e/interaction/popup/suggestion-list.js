const { Suggestion } = require('./suggestion');

function getXPathForSuggestionByDescription(description){
    return `//*[@data-e2e='suggestion' and ./descendant-or-self::*[@data-e2e = 'description' and text() = '${description}']]`;
}

class SuggestionList{
    constructor(element, frame){
        this.element = element;
        this.frame = frame;
    }
    waitForFirstSuggestion(){
        return this.element.waitForSelector('[data-e2e=suggestion]');
    }
    whenEmpty(){
        return this.element.waitForSelector('[data-e2e=suggestion]', {hidden: true});
    }
    async whenNoSuggestionByDescription(description){
        await this.frame.waitForXPath(getXPathForSuggestionByDescription(description), {hidden: true});
    }
    async waitForSuggestionByDescriptionAtIndex(description, index){
        const element = await this.frame.waitForXPath(`//*[position() = ${index + 1} and @data-e2e='suggestion' and ./descendant-or-self::*[@data-e2e = 'description' and text() = '${description}']]`);
        return new Suggestion(element);
    }
    async waitForFirstSuggestionByDescription(description){
        const element = await this.frame.waitForXPath(getXPathForSuggestionByDescription(description), {visible: true});
        return new Suggestion(element);
    }
    async getSuggestionsByDescription(description){
        const elements = await this.element.$x(getXPathForSuggestionByDescription(description));
        return elements.map(e => new Suggestion(e));
    }
    async getNumberOfSuggestions(){
        return (await this.element.$$('[data-e2e=suggestion]')).length;
    }
    async reload(){
        const reloadButton = await this.element.$('[data-e2e=reload-suggestions]');
        await reloadButton.click();
    }
}

module.exports = { SuggestionList }