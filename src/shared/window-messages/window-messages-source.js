import { MessagesSource } from '../events';

export class WindowMessagesSource extends MessagesSource{
    constructor(sourceWindow, windowMessagesEventSource){
        super();
        this.sourceWindow = sourceWindow;
        this.messagesEventSource = windowMessagesEventSource
            .filter(event => event.source === sourceWindow && event.data && event.data.type === 'message')
            .map(event => [event.data.message, resp => this.sendResponseToMessage(event.data.messageId, resp)]);
    }
    sendResponseToMessage(messageId, response){
        this.sourceWindow.postMessage({
            type: 'response',
            messageId: messageId,
            response: response
        }, "*");
    }
    onMessage(listener, cancellationToken){
        return this.messagesEventSource.listen(listener, cancellationToken);
	}
}