const { Toolbar } = require('./toolbar');

class ElementsPanel{
    constructor(element, page, devToolsPage){
        this.element = element;
        this.page = page;
        this.devToolsPage = devToolsPage;
    }
    async getSidePanelToolbar(){
        const element = await this.element.$('acrossShadowRoots/[aria-label="Side panel toolbar"]');
        return new Toolbar(element, this.page, this.devToolsPage);
    }
    async selectTreeItemWhoseTextMatches(regexString){
        const pageDom = await this.page.$('acrossShadowRoots/[aria-label="Page DOM"]');
        const treeItems = await pageDom.$$('[role=treeitem]');
        let clicked = false;
        const regex = new RegExp(regexString);
        await Promise.all(treeItems.map(async treeItem => {
            const textContent = (await treeItem.evaluate((node) => node.textContent)).replace(/\u200b/g,'');
            if(regex.test(textContent) && !clicked){
                clicked = true;
                await treeItem.click();
            }
        }));
    }
}

module.exports = { ElementsPanel };