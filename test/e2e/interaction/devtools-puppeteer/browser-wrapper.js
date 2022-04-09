const { isDevtoolsPageUrl } = require('./is-devtools-page-url');
const { DevtoolsPage } = require('./devtools-page');

class DevtoolsBrowserWrapper{
    constructor(devtoolsBrowser){
        this.devtoolsBrowser = devtoolsBrowser;
        this.devtoolsPages = [];
        for(let target of devtoolsBrowser.targets()){
            this.onNewTargetInfo(target)
        }
        devtoolsBrowser.on('targetcreated', target => this.onNewTargetInfo(target));
        devtoolsBrowser.on('targetchanged', target => this.onNewTargetInfo(target))
    }
    onNewTargetInfo(target){
       const url = target.url();
       if(isDevtoolsPageUrl(url)){
           this.addDevtoolsPage(target)
       }
    }
    removeDevtoolsPage(page){
        const index = this.devtoolsPages.indexOf(page);
        if(index === -1){
            return;
        }
        this.devtoolsPages.splice(index, 1);
    }
    async addDevtoolsPage(target){
        let page;
        try{
            page = await target.page();
        }catch(e){
            return;
        }
        const wrappedPage = new DevtoolsPage(page);
        this.devtoolsPages.push(wrappedPage);
        page.on('close', () => this.removeDevtoolsPage(wrappedPage));
    }
    async getDevtoolsPage(inspectedPage){
        await inspectedPage.bringToFront();
        const text = `this is the console for page ${Math.floor(Math.random() * 10000)}`;
        await inspectedPage.evaluate((text) => console.log(text), text)
        return await Promise.race(this.devtoolsPages.map(p => p.waitForConsoleMessageWithText(text)));
    }
}

function wrapDevtoolsBrowser(devtoolsBrowser){
    return new DevtoolsBrowserWrapper(devtoolsBrowser);
}

module.exports = { wrapDevtoolsBrowser }