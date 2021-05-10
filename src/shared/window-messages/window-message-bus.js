import { WindowMessagesSource } from './window-messages-source';
import { WindowMessagesTarget } from './window-messages-target';
import { MessagesSource, MessagesTarget } from '../events';

class IframeMessageChannel{
    constructor(source, target){
        this.source = source;
        this.target = target;
    }
}

class IframeChannelMessagesSource extends MessagesSource{
    constructor(messageType, messagesSource){
        super();
        this.source = messagesSource.ofType(messageType);
    }
    onMessage(listener, cancellationToken){
		return this.source.onMessage(listener, cancellationToken);
	}
}

class IframeChannelMessagesTarget extends MessagesTarget{
    constructor(messageType, messagesTarget){
        super();
        this.target = messagesTarget.ofType(messageType);
    }
    sendMessageAsync(msg){
        return this.target.sendMessageAsync(msg);
    }
	sendMessage(msg){
        this.target.sendMessage(msg);
    }
}

export class WindowMessageBus{
    constructor(messagesSource, messagesTarget){
        this.messagesSource = messagesSource;
        this.messagesTarget = messagesTarget;
    }
    createChannel(messageType){
        const source = new IframeChannelMessagesSource(messageType, this.messagesSource);
        const target = new IframeChannelMessagesTarget(messageType, this.messagesTarget);
        return new IframeMessageChannel(source, target);
    }
    static create(otherWindow, windowMessagesEventSource){
        const messagesSource = new WindowMessagesSource(otherWindow, windowMessagesEventSource);
        const messagesTarget = new WindowMessagesTarget(otherWindow, windowMessagesEventSource);
        return new WindowMessageBus(messagesSource, messagesTarget);
    }
}