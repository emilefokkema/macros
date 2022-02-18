class NavigationForSandbox{
    constructor(id, historyId, url, tabId, frameId, focusNavigationMessageTarget){
        this.id = id;
        this.historyId = historyId;
        this.url = url;
        this.tabId = tabId;
        this.frameId = frameId;
        this.focusNavigationMessageTarget = focusNavigationMessageTarget;
    }
    focus(){
        this.focusNavigationMessageTarget.sendMessage(this.id);
    }
}

export class NavigationInterfaceForSandbox{
    constructor(
        navigationDisappearedMessageSource,
        navigationExistsMessageTarget,
        navigationPropsRequestTarget,
        focusNavigationMessageTarget,
        popupTabIdMessageTarget,
        navigationsForPopupMessageTarget,
        openTabMessageTarget){
            this.navigationDisappearedMessageSource = navigationDisappearedMessageSource;
            this.navigationExistsMessageTarget = navigationExistsMessageTarget;
            this.navigationPropsRequestTarget = navigationPropsRequestTarget;
            this.focusNavigationMessageTarget = focusNavigationMessageTarget;
            this.popupTabIdMessageTarget = popupTabIdMessageTarget;
            this.navigationsForPopupMessageTarget = navigationsForPopupMessageTarget;
            this.openTabMessageTarget = openTabMessageTarget;
    }
    openTab(url){
        this.openTabMessageTarget.sendMessage(url);
    }
    getNavigationsForPopup(){
        return this.navigationsForPopupMessageTarget.sendMessageAsync();
    }
    getPopupTabId(){
        return this.popupTabIdMessageTarget.sendMessageAsync();
    }
    navigationExists(navigationId){
        return this.navigationExistsMessageTarget.sendMessageAsync(navigationId);
    }
    onDisappeared(listener, cancellationToken){
        return this.navigationDisappearedMessageSource.onMessage(listener, cancellationToken);
    }
    whenDisappeared(navigationId){
        return new Promise((resolve) => {
            const sub = this.navigationDisappearedMessageSource.onMessage(async () => {
                const exists = await this.navigationExists(navigationId);
                if(!exists){
                    sub.cancel();
                    resolve();
                }
            });
        });
    }
    async getNavigation(navigationId){
        if(!await this.navigationExists(navigationId)){
            return null;
        }
        const {id, historyId, url, tabId, frameId} = await this.navigationPropsRequestTarget.sendMessageAsync(navigationId);
        return new NavigationForSandbox(id, historyId, url, tabId, frameId, this.focusNavigationMessageTarget);
    }
}