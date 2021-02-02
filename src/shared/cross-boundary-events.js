import { MessageType, MessagesSource, MessagesTarget, Event } from './events';
import { runtimeMessagesTarget, runtimeMessagesSource, CombinedMessagesTarget } from './runtime-messages';
import { navigationMessagesEventSource } from './navigation/navigations';
import { storage } from './storage'

var subscriptionMessageType = new MessageType('crossBoundarySubscription');

class CrossBoundaryMessagesSource extends MessagesSource{
    constructor(type){
        super();
        this.type = type;
        var messageType = new MessageType(type);
        this.messageType = messageType;
        this.source = runtimeMessagesSource.ofType(this.messageType);
        this.messageFromNavigationSource = navigationMessagesEventSource.filter((msg) => messageType.filterMessage(msg)).map((msg, navigation, sendResponse) => [messageType.unpackMessage(msg), navigation, sendResponse]);
        this.subscriptionMessageTarget = runtimeMessagesTarget.ofType(subscriptionMessageType);
        this.navigationSubscriptionRequested = new Event();
        navigationMessagesEventSource
            .filter(msg => subscriptionMessageType.filterMessage(msg))
            .map((msg, navigation) => [subscriptionMessageType.unpackMessage(msg), navigation])
            .filter((msg) => msg.messageType === this.type)
            .listen((msg, navigation) => {
                this.navigationSubscriptionRequested.dispatch(navigation);
            });
    }

    onMessageFromNavigation(listener, cancellationToken){
        return this.messageFromNavigationSource.listen(listener, cancellationToken);
    }
    
    onMessage(listener, cancellationToken){
        this.subscriptionMessageTarget.sendMessage({messageType: this.type});
        return this.source.onMessage(listener, cancellationToken);
    }
}

class CrossBoundarySubscriptionForType{
    constructor(type, combinedTarget){
        this.type = type;
        this.combinedTarget = combinedTarget;
        this.updated = new Event();
        combinedTarget.updated.listen(() => this.updated.dispatch());
    }
    get empty(){return this.combinedTarget.empty;}
    toJSON(){
        return {
            type: this.type,
            target: this.combinedTarget 
        };
    }
    load({target}){
        return this.combinedTarget.load(target);
    }
}

class CrossBoundarySubscriptionCollection{
    constructor(){
        this.subscriptions = [];
    }
    save(){
        var nonEmpty = this.subscriptions.filter(s => !s.empty);
        console.log(`saving crossBoundarySubscriptions: ${nonEmpty.length} in number`)
        storage.setItem('crossBoundarySubscriptions', nonEmpty)
    }
    addSubscription(type, target){
        if(!this.subscriptions.some(s => s.type === type)){
            var subscription = new CrossBoundarySubscriptionForType(type, target);
            this.subscriptions.push(subscription);
            subscription.updated.listen(() => this.save());
        }
    }
    async loadSubscriptionForType(type){
        var subscription = this.subscriptions.find(s => s.type === type);
        if(!subscription){
            return;
        }
        var storedForType = (storage.getItem('crossBoundarySubscriptions') || []).find(s => s.type === type);
        if(!storedForType){
            return;
        }
        await subscription.load(storedForType);
        this.save();
    }
}

var subscriptionCollection = new CrossBoundarySubscriptionCollection();

class CrossBoundaryMessagesTarget extends MessagesTarget{
    constructor(type){
        super();
        this.type = type;
        this.combinedTarget = new CombinedMessagesTarget();
        subscriptionCollection.addSubscription(type, this.combinedTarget);
        this.target = this.combinedTarget.ofType(new MessageType(type));
        this.loaded = false;
        this.loadingPromise = undefined;
    }
    async ensureLoaded(){
        if(this.loaded){
            return;
        }
        await (this.loadingPromise = this.loadingPromise || subscriptionCollection.loadSubscriptionForType(this.type));
        this.loaded = true;
    }
    async sendMessageAsync(msg){
        await this.ensureLoaded();
        return this.target.sendMessageAsync(msg);
    }
	sendMessage(msg){
        this.ensureLoaded().then(() => this.target.sendMessage(msg));
    }
    addTarget(target){
        this.ensureLoaded().then(() => this.combinedTarget.addTarget(target));
    }
}

class CrossBoundaryEvent{
    constructor(type){
        this.target = new CrossBoundaryMessagesTarget(type);
        this.source = new CrossBoundaryMessagesSource(type);
        this.source.navigationSubscriptionRequested.listen((navigation) => {
            this.target.addTarget(navigation.messagesTarget);
        });
    }
}

class Factory{

    create(type){
        return new CrossBoundaryEvent(type);
    }
}

var crossBoundaryEventFactory = new Factory();

export { crossBoundaryEventFactory }