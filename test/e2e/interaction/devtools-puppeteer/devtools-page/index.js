const { Toolbar } = require('./toolbar');
const { ConsolePanel } = require('./console-panel');
const { ElementsPanel } = require('./elements-panel');

class DevtoolsPage{
    constructor(page){
        this.page = page;
        this.softMenuIsUsed = false;
    }
    waitForFrame(...args){
        return this.page.waitForFrame(...args);
    }
    frames(){
        return this.page.frames();
    }
    async whenInitialized(){
        if(this.initialized){
            return;
        }
        await this.initializationPromise;
    }
    async ensureSoftMenuIsUsed(){
        if(this.softMenuIsUsed){
            return;
        }
        await this.page.evaluate(() => DevToolsAPI.setUseSoftMenu(true));
        this.softMenuIsUsed = true;
    }
    async getMainToolbar(){
        const mainToolbarElement = await this.page.$('acrossShadowRoots/[aria-label="Main toolbar"]');
        return new Toolbar(mainToolbarElement, this.page, this);
    }
    async showPanel(toolbarAriaLabel, panelAriaLabel, panelFactory){
        const mainToolbar = await this.getMainToolbar();
        const [panel] = await Promise.all([
            (async () => {
                const panelElement = await this.page.waitForSelector(`[aria-label="${panelAriaLabel}"]`, {visible: true});
                return panelFactory(panelElement, this.page)
            })(),
            mainToolbar.clickTabByAriaLabel(toolbarAriaLabel)
        ]);
        return panel;
    }
    showConsolePanel(){
        return this.showPanel('Console', 'Console panel', (element, page) => new ConsolePanel(element, page));
    }
    showElementsPanel(){
        return this.showPanel('Elements', 'Elements panel', (element, page) => new ElementsPanel(element, page, this));
    }
    async waitForConsoleMessageWithText(text){
        const consolePanel = await this.showConsolePanel();
        await consolePanel.waitForConsoleMessageByText(text);
        return this;
    }
}

module.exports = { DevtoolsPage }