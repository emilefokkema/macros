export class PageInterfaceForIframe{
    constructor(documentTitleMessageTarget, historyStateMessageTarget){
        this.documentTitleMessageTarget = documentTitleMessageTarget;
        this.historyStateMessageTarget = historyStateMessageTarget;
    }
    getLocation(){
        return window.location.href;
    }
    async pushHistoryState(newUrl){
        history.pushState('',{}, newUrl);
        await this.historyStateMessageTarget.sendMessageAsync(newUrl);
    }
    setTitle(title){
        document.title = title;
        this.documentTitleMessageTarget.sendMessage(title);
    }
}