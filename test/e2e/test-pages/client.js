const { AnnoyingPopupPage } = require('./interaction/annoying-popup');

class TestPagesClient{
    constructor(){
        this.latestAnnoyingPopupPageTabId = 0;
        this.latestPageWithIframeTabId = 0;
    }
    goToAnnoyingPopup(page, options){
        return AnnoyingPopupPage.openOn(page, options, this.latestAnnoyingPopupPageTabId++);
    }
    goToIframeWithAnnoyingPopup(page, options){
        return AnnoyingPopupPage.openInIframe(page, options, this.latestPageWithIframeTabId++);
    }
}

module.exports = {TestPagesClient}