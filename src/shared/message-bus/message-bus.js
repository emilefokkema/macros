import { MessageType, MessagesTarget, MessagesSource } from '../events';
import { CrossBoundarySubscriptionCollection } from './cross-boundary-subscription-collection';
import { TabMessagesTarget } from './tab-messages-target';
import { MessageChannel } from './message-channel';
import { CombinedMessagesTarget } from './combined-messages-target';

var subscriptionMessageType = new MessageType('crossBoundarySubscription');
var targetRequestType = new MessageType('requestTarget');

class ChannelMessageTargetForBackground extends MessagesTarget{
    constructor(type, subscriptionCollection){
        super();
        this.type = type;
        this.messageType = new MessageType(type);
        this.subscriptionCollection = subscriptionCollection;
    }
    getTarget(){
        const target = this.subscriptionCollection.getTargetForType(this.type);
        return target.ofType(this.messageType);
    }
    sendMessage(msg){
        this.getTarget().sendMessage(msg);
    }
    sendMessageAsync(msg){
        return this.getTarget().sendMessageAsync(msg);
    }
}

class ChannelMessageTarget extends MessagesTarget{
    constructor(type, targetRequestTarget, runtimeMessagesTarget, tabMessagesTargetFactory){
        super();
        this.targetRequestTarget = targetRequestTarget;
        this.type = type;
        this.messageType = new MessageType(type);
        this.runtimeMessagesTarget = runtimeMessagesTarget;
        this.tabMessagesTargetFactory = tabMessagesTargetFactory;
    }
    async getTarget(){
        const serialized = await this.targetRequestTarget.sendMessageAsync({type: this.type});
        return CombinedMessagesTarget.create(serialized, this.runtimeMessagesTarget, this.tabMessagesTargetFactory).ofType(this.messageType);
    }
    sendMessage(msg){
        this.getTarget().then(t => t.sendMessage(msg));
    }
    async sendMessageAsync(msg){
        var target = await this.getTarget();
        return await target.sendMessageAsync(msg);
    }
}

class ChannelMessageSourceForBackground extends MessagesSource{
    constructor(type, navigationEventProvider, runtimeMessagesSource){
        super();
        const messageType = new MessageType(type);
        this.source = runtimeMessagesSource.ofType(messageType);
        this.messageFromNavigationSource = navigationEventProvider.navigationMessages
            .filter((msg) => messageType.filterMessage(msg))
            .map((msg, navigation, sendResponse) => [messageType.unpackMessage(msg), navigation, sendResponse]);
    }
    onMessage(listener, cancellationToken){
        return this.source.onMessage(listener, cancellationToken);
    }
    onMessageFromNavigation(listener, cancellationToken){
        return this.messageFromNavigationSource.listen(listener, cancellationToken);
    }
}

class ChannelMessageSource extends MessagesSource{
    constructor(type, navigationEventProvider, runtimeMessagesSource, subscriptionMessageTarget){
        super();
        const messageType = new MessageType(type);
        this.type = type;
        this.source = runtimeMessagesSource.ofType(messageType);
        this.messageFromNavigationSource = navigationEventProvider.navigationMessages
            .filter((msg) => messageType.filterMessage(msg))
            .map((msg, navigation, sendResponse) => [messageType.unpackMessage(msg), navigation, sendResponse]);
        this.subscriptionMessageTarget = subscriptionMessageTarget;
    }
    onMessage(listener, cancellationToken){
        this.subscriptionMessageTarget.sendMessage({messageType: this.type});
        return this.source.onMessage(listener, cancellationToken);
    }
    onMessageFromNavigation(listener, cancellationToken){
        return this.messageFromNavigationSource.listen(listener, cancellationToken);
    }
}

class MessageBusForBackground{
    constructor(subscriptionCollection, navigationEventProvider, runtimeMessagesSource){
        this.subscriptionCollection = subscriptionCollection;
        this.navigationEventProvider = navigationEventProvider;
        this.runtimeMessagesSource = runtimeMessagesSource;
    }
    createChannel(type){
        const target = new ChannelMessageTargetForBackground(type, this.subscriptionCollection);
        const source = new ChannelMessageSourceForBackground(type, this.navigationEventProvider, this.runtimeMessagesSource);
        return new MessageChannel(target, source);
    }
}

class MessageBusForNotBackground{
    constructor(targetRequestTarget, runtimeMessagesTarget, runtimeMessagesSource, navigationEventProvider, subscriptionMessageTarget, tabMessagesTargetFactory){
        this.targetRequestTarget = targetRequestTarget;
        this.runtimeMessagesTarget = runtimeMessagesTarget;
        this.runtimeMessagesSource = runtimeMessagesSource;
        this.navigationEventProvider = navigationEventProvider;
        this.subscriptionMessageTarget = subscriptionMessageTarget;
        this.tabMessagesTargetFactory = tabMessagesTargetFactory;
    }
    createChannel(type){
        const target = new ChannelMessageTarget(type, this.targetRequestTarget, this.runtimeMessagesTarget, this.tabMessagesTargetFactory);
        const source = new ChannelMessageSource(type, this.navigationEventProvider, this.runtimeMessagesSource, this.subscriptionMessageTarget);
        return new MessageChannel(target, source);
    }
}

export class MessageBus{
    static createForBackground(
        storage,
        tabCollection,
        runtimeMessagesEventSource,
        runtimeMessagesTarget,
        runtimeMessagesSource,
        senderIdentifier,
        tabRemoved,
        navigationEventProvider,
        tabMessagesTargetFactory){
            const subscriptionCollection = new CrossBoundarySubscriptionCollection(storage, tabCollection, runtimeMessagesTarget, tabMessagesTargetFactory);
            runtimeMessagesEventSource
                .filter((msg, sender) => subscriptionMessageType.filterMessage(msg) && !senderIdentifier.isExtension(sender))
                .map((msg, sender) => [subscriptionMessageType.unpackMessage(msg), tabMessagesTargetFactory.createTarget(sender.tab && sender.tab.id)])
                .listen(({messageType}, tabMessagesTarget) => {
                    subscriptionCollection.addTargetForType(messageType, tabMessagesTarget);
                });
            tabRemoved.listen(() => subscriptionCollection.pruneSubscriptions());
            runtimeMessagesSource.ofType(targetRequestType).onMessage(({type}, sendResponse) => {
                const target = subscriptionCollection.getTargetForType(type);
                sendResponse(target.serialize());
            });
            return new MessageBusForBackground(subscriptionCollection, navigationEventProvider, runtimeMessagesSource);
    }
    static create(runtimeMessagesTarget, runtimeMessagesSource, navigationEventProvider, tabMessagesTargetFactory){
        const targetRequestTarget = runtimeMessagesTarget.ofType(targetRequestType);
        const subscriptionMessageTarget = runtimeMessagesTarget.ofType(subscriptionMessageType);
        return new MessageBusForNotBackground(
            targetRequestTarget,
            runtimeMessagesTarget,
            runtimeMessagesSource,
            navigationEventProvider,
            subscriptionMessageTarget,
            tabMessagesTargetFactory);
    }
}