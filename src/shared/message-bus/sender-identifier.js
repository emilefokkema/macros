const id = chrome.runtime.id;

export class SenderIdentifier{
    isExtension(sender){
        return sender.origin === `chrome-extension://${id}`;
    }
}