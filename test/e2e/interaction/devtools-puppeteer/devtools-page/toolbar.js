class Toolbar{
    constructor(element, page, devToolsPage){
        this.element = element;
        this.page = page;
        this.devToolsPage = devToolsPage;
    }
    async clickTabByAriaLabel(label){
        const tabElement = await this.element.$(`[role="tab"][aria-label="${label}"]`);
        if(tabElement){
            return await tabElement.click();
        }
        await this.devToolsPage.ensureSoftMenuIsUsed();
        const moreTabsButton = await this.element.$('[role="button"][aria-label="More tabs"]');
        await moreTabsButton.click();
        const menuItem = await this.page.waitForSelector(`acrossShadowRoots/[aria-label="${label}"]`, {visible: true});
        await menuItem.click();
    }
}

module.exports = { Toolbar }