const { getOrWaitForFrame } = require('../../util/get-or-wait-for-frame');

function goToUrlWithOptions(page, urlString, tabId, options){
    const url = new URL(urlString);
    const manual = options && options.manual;
    if(manual){
        url.searchParams.set('manual', 'true');
    }
    url.searchParams.set('tabId', tabId);
    const newUrlString = url.toString();
    return page.goto(newUrlString, { waitUntil: 'load' });
}

class AnnoyingPopupPage{
    constructor(page, frame){
        this.page = page;
        this.frame = frame;
        this.url = page.url();
    }
    reload(){
        return this.page.reload({waitUntil: 'load'})
    }
    bringToFront(){
        return this.page.bringToFront();
    }
    async clickShowPopupLink(){
        const link = await this.frame.$('#showPopup');
        await link.click();
    }
    async showPopup(){
        return await Promise.all([this.clickShowPopupLink(), this.whenPopupIsVisible()]);
    }
    whenPopupIsVisible(){
        return this.frame.waitForSelector('.annoying-backdrop', {visible: true})
    }
    whenPopupIsHidden(){
        return this.frame.waitForSelector('.annoying-backdrop', {hidden: true})
    }
    static async openOn(page, options, tabId){
        await goToUrlWithOptions(page, 'http://localhost:8080/annoying-popup/', tabId, options);
        return new AnnoyingPopupPage(page, page.mainFrame());
    }
    static async openInIframe(page, options, tabId){
        await goToUrlWithOptions(page, 'http://localhost:8080/iframe-with-annoying-popup/', tabId, options);
        const frame = await getOrWaitForFrame(page, f => /\/annoying-popup/.test(f.url()));
        return new AnnoyingPopupPage(page, frame);
    }
}

module.exports = { AnnoyingPopupPage }