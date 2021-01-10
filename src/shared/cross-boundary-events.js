import { MessageType, MessagesSource } from './events';
import { runtimeMessagesEventSource, runtimeMessagesTarget, runtimeMessagesSource, activeTabMessagesTarget } from './runtime-messages';

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
        //this.subscriptionMessageTarget.sendMessage({messageType: this.type});
        return this.source.onMessage(listener, cancellationToken);
    }
}

class CrossBoundaryEvent{
    constructor(type){
        this.type = type;
        var messageType = new MessageType(type);
        this.source = new CrossBoundaryMessagesSource(type);
        this.target = runtimeMessagesTarget.ofType(messageType);
        this.activeTabTarget = activeTabMessagesTarget.ofType(messageType);
    }
}

class Factory{

    create(type){
        return new CrossBoundaryEvent(type);
    }
}

var crossBoundaryEventFactory = new Factory();

export { crossBoundaryEventFactory }