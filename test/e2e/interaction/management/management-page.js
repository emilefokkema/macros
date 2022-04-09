const { Rule } = require('./rule');

class ManagementPage{
    constructor(page, frame){
        this.page = page;
        this.frame = frame;
    }
    async waitForRuleByName(name){
        const element = await this.frame.waitForXPath(`//*[@data-e2e = "rule" and ./descendant-or-self::*[@data-e2e = "name" and text() = "${name}"]]`, {visible: true});
        return new Rule(element);
    }
    async upload(){
        const uploadButton = await this.frame.$('[data-e2e=upload]');
        await uploadButton.click();
    }
}

module.exports = { ManagementPage }