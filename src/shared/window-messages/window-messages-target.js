import { MessagesTarget } from '../events';

class MessageResponsePromise{
    constructor(messageId){
        this.messageId = messageId;
        this.promise = new Promise((_res) => {
            this.resolve = _res;
        });
    }
}

export class WindowMessagesTarget extends MessagesTarget{
    constructor(targetWindow, windowMessagesEventSource){
        super();
        this.latestMessageId = 0;
        this.messageResponsePromises = [];
        this.targetWindow = targetWindow;
        windowMessagesEventSource
            .filter(event => event.source === targetWindow && event.data && event.data.type === 'response')
            .listen(event => this.resolveResponsePromise(event.data.messageId, event.data.response));
    }
    resolveResponsePromise(messageId, response){
        const index = this.messageResponsePromises.findIndex(p => p.messageId === messageId);
        if(index === -1){
            return;
        }
        const [promise] = this.messageResponsePromises.splice(index, 1);
        promise.resolve(response);
    }
    async sendMessageAsync(msg){
        const messageId = ++this.latestMessageId;
        const responsePromise = new MessageResponsePromise(messageId);
        this.messageResponsePromises.push(responsePromise);
        this.targetWindow.postMessage({
            type: 'message',
            messageId: messageId,
            message: msg
        }, "*");
        return responsePromise.promise;
    }
	sendMessage(msg){
        const messageId = ++this.latestMessageId;
        this.targetWindow.postMessage({
            type: 'message',
            messageId: messageId,
            message: msg
        }, "*");
    }
}