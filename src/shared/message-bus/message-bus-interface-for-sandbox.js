import { MessagesSource, MessagesTarget } from '../events';
import { MessageBusMessageType} from './message-bus-message-type';

class MessageBusInterfaceMessagesSourceForIframe extends MessagesSource{
    constructor(type, iframeChannelSource, channelSubscriptionMessageTarget){
        super();
        this.type = type;
        this.iframeChannelSource = iframeChannelSource;
        this.channelSubscriptionMessageTarget = channelSubscriptionMessageTarget;
    }
    onMessage(listener, cancellationToken){
        this.channelSubscriptionMessageTarget.sendMessage({messageType: this.type, sendsResponse: listener.length === 2});
		return this.iframeChannelSource.onMessage(listener, cancellationToken);
	}
}

class MessageBusInterfaceMessagesTargetForIframe extends MessagesTarget {
    constructor(type, iframeChannelTarget, targetInitializationMessageTarget){
        super();
        this.type = type;
        this.targetInitializationMessageTarget = targetInitializationMessageTarget;
        this.iframeChannelTarget = iframeChannelTarget;
        this.targetInitialized = false;
    }
    async ensureInitialized(expectResponse){
        if(this.targetInitialized){
            return;
        }
        await this.targetInitializationMessageTarget.sendMessageAsync({messageType: this.type, expectsResponse: expectResponse});
        this.targetInitialized = true;
    }
    async sendMessageAsync(msg){
        await this.ensureInitialized(true);
        return await this.iframeChannelTarget.sendMessageAsync(msg);
    }
	sendMessage(msg){
        this.ensureInitialized(false).then(() => {
            this.iframeChannelTarget.sendMessage(msg);
        });
    }
}

class MessageBusInterfaceChannelForIframe{
    constructor(source, target){
        this.source = source;
        this.target = target;
    }
}

class MessageBusInterfaceForSandboxIframe{
    constructor(iframeMessageBus, targetInitializationMessageTarget, channelSubscriptionMessageTarget){
        this.iframeMessageBus = iframeMessageBus;
        this.targetInitializationMessageTarget = targetInitializationMessageTarget;
        this.channelSubscriptionMessageTarget = channelSubscriptionMessageTarget;
    }
    createChannel(type){
        const iframeChannel = this.iframeMessageBus.createChannel(new MessageBusMessageType(type));
        const source = new MessageBusInterfaceMessagesSourceForIframe(type, iframeChannel.source, this.channelSubscriptionMessageTarget);
        const target = new MessageBusInterfaceMessagesTargetForIframe(type, iframeChannel.target, this.targetInitializationMessageTarget);
        return new MessageBusInterfaceChannelForIframe(source, target);
    }
}

function connectChannels(sourceChannel, destinationChannel, responseIsSent){
    if(responseIsSent){
        sourceChannel.source.onMessage(async (msg, sendResponse) => {
            const response = await destinationChannel.target.sendMessageAsync(msg);
            sendResponse(response);
        });
    }else{
        sourceChannel.source.onMessage((msg) => {
            destinationChannel.target.sendMessage(msg);
        });
    }
}

export class MessageBusInterfaceForSandbox{
    static initializeForParent(iframeMessageBus, targetInitializationMessageSource, channelSubscriptionMessageSource, messageBus){
        channelSubscriptionMessageSource.onMessage(({messageType, sendsResponse}) => {
            const iframeMessageBusChannel = iframeMessageBus.createChannel(new MessageBusMessageType(messageType));
            const messageBusChannel = messageBus.createChannel(messageType);
            connectChannels(messageBusChannel, iframeMessageBusChannel, sendsResponse);
        });
        targetInitializationMessageSource.onMessage(({messageType, expectsResponse}, sendResponse) => {
            const iframeMessageBusChannel = iframeMessageBus.createChannel(new MessageBusMessageType(messageType));
            const messageBusChannel = messageBus.createChannel(messageType);
            connectChannels(iframeMessageBusChannel, messageBusChannel, expectsResponse);
            sendResponse();
        });
    }
    static createForIframe(iframeMessageBus, targetInitializationMessageTarget, channelSubscriptionMessageTarget){
        return new MessageBusInterfaceForSandboxIframe(iframeMessageBus, targetInitializationMessageTarget, channelSubscriptionMessageTarget);
    }
}