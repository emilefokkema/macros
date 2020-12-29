import { MessageType, MessagesSource, MessagesTarget } from './events';
import { runtimeMessagesEventSource, runtimeMessagesTarget, runtimeMessagesSource } from './runtime-messages';

var subscriptionMessageType = new MessageType('crossBoundarySubscription');

class CrossBoundaryMessagesSource extends MessagesSource{
    constructor(type){
        super();
        this.type = type;
        this.messageType = new MessageType(type);
        this.source = runtimeMessagesSource.ofType(this.messageType);
        this.subscriptionMessageTarget = runtimeMessagesTarget.ofType(subscriptionMessageType);
        runtimeMessagesEventSource
            .filter(msg => subscriptionMessageType.filterMessage(msg))
            .map((msg, sender) => [subscriptionMessageType.unpackMessage(msg), sender])
            .filter((msg) => msg.messageType === this.type)
            .listen((msg, sender) => {
                console.log(`this sender wants to subscribe to '${this.type}': `, sender)
            });
    }
    
    onMessage(listener, cancellationToken){
        this.subscriptionMessageTarget.sendMessage({messageType: this.type});
        return this.source.onMessage(listener, cancellationToken);
    }
}

class CrossBoundaryMessagesTarget extends MessagesTarget{
    constructor(type){
        super();
        this.type = type;
        this.messageType = new MessageType(type);
        this.target = runtimeMessagesTarget.ofType(this.messageType);
    }
    sendMessageAsync(msg){
        return this.target.sendMessageAsync(msg);
    }
    sendMessage(msg){
        this.target.sendMessage(msg);
    }
}

class CrossBoundaryEvent{
    constructor(type){
        this.type = type;
        this.source = new CrossBoundaryMessagesSource(type);
        this.target = new CrossBoundaryMessagesTarget(type);
    }
}

class Factory{

    create(type){
        return new CrossBoundaryEvent(type);
    }
}

var crossBoundaryEventFactory = new Factory();

export { crossBoundaryEventFactory }