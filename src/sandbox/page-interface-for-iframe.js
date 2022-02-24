import { WindowInputWatcher } from '../shared/window-input-watcher';

export class PageInterfaceForIframe{
    constructor(
            documentTitleMessageTarget,
            historyStateMessageTarget,
            closeWindowMessageTarget,
            unsavedChangesWarningEnabledMessageTarget,
            downloadJsonMessageTarget,
            copyToClipboardMessageTarget){
        this.documentTitleMessageTarget = documentTitleMessageTarget;
        this.historyStateMessageTarget = historyStateMessageTarget;
        this.closeWindowMessageTarget = closeWindowMessageTarget;
        this.unsavedChangesWarningEnabledMessageTarget = unsavedChangesWarningEnabledMessageTarget;
        this.downloadJsonMessageTarget = downloadJsonMessageTarget;
        this.copyToClipboardMessageTarget = copyToClipboardMessageTarget;
        this.unsavedChangesWarningEnabled = false;
        this.windowInputWatcher = new WindowInputWatcher();
        this.windowInputWatcher.watch();
    }
    getLocation(){
        return window.location.href;
    }
    close(){
        this.closeWindowMessageTarget.sendMessage({});
    }
    downloadJson(object, fileName){
        this.downloadJsonMessageTarget.sendMessage({object, fileName});
    }
    copyToClipboard(text){
        return this.copyToClipboardMessageTarget.sendMessageAsync({text});
    }
    setUnsavedChangedWarningEnabled(enabled){
        if(enabled === this.unsavedChangesWarningEnabled){
            return;
        }
        this.unsavedChangesWarningEnabled = enabled;
        if(enabled){
            this.windowInputWatcher.whenInputHasHappened().then(() => {
                if(this.unsavedChangesWarningEnabled){
                    this.unsavedChangesWarningEnabledMessageTarget.sendMessage({enabled: true});
                }
            });
        }else{
            this.unsavedChangesWarningEnabledMessageTarget.sendMessage({enabled: false});
        }
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