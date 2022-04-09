const puppeteer = require('puppeteer');
const path = require('path')
const { Popup } = require('./popup/popup.js')
const { RuleEditor } = require('./rule-editor/rule-editor');
const { ManagementPage } = require('./management/management-page');
const { DevtoolsSidebar } = require('./devtools-sidebar/devtools-sidebar');
const devtoolsPuppeteer = require('./devtools-puppeteer');
const { ExtensionPageUrl } = require('./extension-page-url');
const { getOrWaitForFrame } = require('../util/get-or-wait-for-frame');
const { getOrWaitForTarget } = require('../util/get-or-wait-for-target');

class Extension{
    constructor(browser, devtoolsBrowser){
        this.browser = browser;
        this.devtoolsBrowser = devtoolsBrowser;
        this.extensionId = undefined;
        this.serviceWorkerTarget = undefined;
    }
    async getExtensionId(){
        if(this.extensionId === undefined){
            this.extensionId = new URL((await this.getServiceWorkerTarget()).url()).hostname;
        }
        return this.extensionId;
    }
    async getServiceWorkerTarget(){
        if(this.serviceWorkerTarget === undefined){
            this.serviceWorkerTarget = await this.browser.waitForTarget(t => t.type() === 'service_worker');
        }
        return this.serviceWorkerTarget;
    }
    getPopupUrl(forTabURL){
        const searchParams = new URLSearchParams();
        searchParams.set('tabURL', forTabURL);
        return `popup.html?${searchParams}`;
    }
    async waitForManagementPage(){
        const url = await ExtensionPageUrl.create('management.html', () => this.getExtensionId());
        const target = await getOrWaitForTarget(this.browser, t => url.inSandbox.regex.test(t.url()));
        const page = await target.page();
        const frame = await getOrWaitForFrame(page, f => url.itself.regex.test(f.url()));
        return new ManagementPage(page, frame);
    }
    async waitForNewRuleEditor(){
        const url = await ExtensionPageUrl.create('create-rule.html', () => this.getExtensionId());
        const target = await getOrWaitForTarget(this.browser, t => url.inSandbox.regex.test(t.url()));
        const page = await target.page();
        const frame = await getOrWaitForFrame(page, f => url.itself.regex.test(f.url()));
        return new RuleEditor(page, frame);
    }
    async getDevtoolsSidebarForPage(page){
        const url = await ExtensionPageUrl.create('devtools_sidebar.html', () => this.getExtensionId());
        const devtoolsPage = await this.devtoolsBrowser.getDevtoolsPage(page);
        const elementsPanel = await devtoolsPage.showElementsPanel();
        const sidePanelToolbar = await elementsPanel.getSidePanelToolbar();
        await sidePanelToolbar.clickTabByAriaLabel('RuleTool');
        const frame = await getOrWaitForFrame(devtoolsPage, f => url.itself.regex.test(f.url()));
        return {elementsPanel, sidebar: new DevtoolsSidebar(frame)};
    }
    async waitForServiceWorkerWithBackgroundLoaded(){
        const target = await this.getServiceWorkerTarget();
        const worker = await target.worker();
        while(await worker.evaluate(() => typeof background === 'undefined')){
            await new Promise(res => setTimeout(res, 20))
        }
        return worker;
    }
    async addExistingRule(rule){
        const worker = await this.waitForServiceWorkerWithBackgroundLoaded();
        await worker.evaluate((rule) => {
            return background.addRule(rule)
        }, rule)
    }
    async openPopupForPage(pageURL){
        const popupUrl = await ExtensionPageUrl.create(this.getPopupUrl(pageURL), () => this.getExtensionId());
        const popupPage = await this.browser.newPage();
        await popupPage.goto(popupUrl.inSandbox.text, { waitUntil: 'load' });
        await popupPage.setDragInterception(true);
        const frame = await getOrWaitForFrame(popupPage, f => popupUrl.itself.regex.test(f.url()));
        return new Popup(popupPage, frame);
    }
    static async loadInBrowser(options){
        const devtools = !!options && !!options.devtools;
        const extensionPath = path.resolve(__dirname, '../../../dist');
        const browser = await puppeteer.launch({
            headless: false,
            args: [
                `--disable-extensions-except=${extensionPath}`,
                `--load-extension=${extensionPath}`,
            ],
            devtools
        });
        let devtoolsBrowser = null;
        if(devtools){
            devtoolsBrowser = await devtoolsPuppeteer.connect(browser)
        }
        return {browser, extension: new Extension(browser, devtoolsBrowser)};
    }
}

module.exports = {Extension};