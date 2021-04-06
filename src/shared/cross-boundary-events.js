import { MessageType, MessagesSource, MessagesTarget, Event } from './events';
import { runtimeMessagesTarget, runtimeMessagesSource, CombinedMessagesTarget } from './runtime-messages';
import { navigationMessagesEventSource } from './navigation/navigations';
import { storage } from './storage';
import { tabRemoved } from './tab-removed';

var subscriptionMessageType = new MessageType('crossBoundarySubscription');
var targetRequestType = new MessageType('requestTarget');
var subscriptionMessageTarget = runtimeMessagesTarget.ofType(subscriptionMessageType);
var targetRequestTarget = runtimeMessagesTarget.ofType(targetRequestType);

var subscriptionMessageSource = navigationMessagesEventSource
    .filter(msg => subscriptionMessageType.filterMessage(msg))
    .map((msg, navigation) => [{type: subscriptionMessageType.unpackMessage(msg).messageType, target: navigation.messagesTarget}]);
var targetRequestSource = runtimeMessagesSource.ofType(targetRequestType);

var managed = false;

async function getCombinedTargetAsync(type){
    var serialized = await targetRequestTarget.sendMessageAsync({type});
    return await CombinedMessagesTarget.create(serialized);
}

class CrossBoundaryMessagesSource extends MessagesSource{
    constructor(type){
        super();
        this.type = type;
        var messageType = new MessageType(type);
        this.messageType = messageType;
        this.source = runtimeMessagesSource.ofType(messageType);
        this.messageFromNavigationSource = navigationMessagesEventSource.filter((msg) => messageType.filterMessage(msg)).map((msg, navigation, sendResponse) => [messageType.unpackMessage(msg), navigation, sendResponse]);
    }

    onMessageFromNavigation(listener, cancellationToken){
        return this.messageFromNavigationSource.listen(listener, cancellationToken);
    }
    
    onMessage(listener, cancellationToken){
        subscriptionMessageTarget.sendMessage({messageType: this.type});
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
    prune(){
        return this.combinedTarget.prune();
    }
    addTarget(target){
        this.combinedTarget.addTarget(target);
    }
    static createNew(type){
        return new CrossBoundarySubscriptionForType(type, new CombinedMessagesTarget());
    }
    static async create({type, target}){
        var combinedTarget = await CombinedMessagesTarget.create(target);
        return new CrossBoundarySubscriptionForType(type, combinedTarget);
    }
}

class CrossBoundarySubscriptionCollection{
    constructor(){
        this.subscriptions = [];
        this.loadingPromise = undefined;
    }
    async pruneSubscriptions(){
        await this.ensureLoaded();
        await Promise.all(this.subscriptions.map(s => s.prune()));
        this.save();
    }
    async save(){
        var nonEmpty = this.subscriptions.filter(s => !s.empty);
        await storage.setItem('crossBoundarySubscriptions', nonEmpty)
    }
    async ensureLoaded(){
        await (this.loadingPromise = this.loadingPromise || this.load());
    }
    async load(){
        var saved = await storage.getItem('crossBoundarySubscriptions') || [];
        var subscriptions = await Promise.all(saved.map(s => CrossBoundarySubscriptionForType.create(s)));
        for(let subscription of subscriptions){
            this.subscriptions.push(subscription);
            subscription.updated.listen(() => this.save());
        }
    }
    async addTargetForType(type, target){
        await this.ensureLoaded();
        var subscription = this.subscriptions.find(s => s.type === type);
        if(!subscription){
            subscription = CrossBoundarySubscriptionForType.createNew(type);
            this.subscriptions.push(subscription);
            subscription.updated.listen(() => this.save());
        }
        subscription.addTarget(target);
    }
    async getTargetForType(type){
        await this.ensureLoaded();
        var subscription = this.subscriptions.find(s => s.type === type) || CrossBoundarySubscriptionForType.createNew(type);
        return subscription.combinedTarget;
    }
}

var subscriptionCollection = new CrossBoundarySubscriptionCollection();

class CrossBoundaryMessagesTarget extends MessagesTarget{
    constructor(type){
        super();
        this.type = type;
        this.messageType = new MessageType(type);
    }
    async getTarget(){
        var target = managed ? await subscriptionCollection.getTargetForType(this.type) : await getCombinedTargetAsync(this.type);
        return target.ofType(this.messageType);
    }
    
    async sendMessageAsync(msg){
        var target = await this.getTarget();
        return target.sendMessageAsync(msg);
    }
	sendMessage(msg){
        this.getTarget().then(t => t.sendMessage(msg));        
    }
}

class CrossBoundaryEvent{
    constructor(target, source){
        this.target = target;
        this.source = source;
    }
}

class Factory{
    constructor(){
        this.subscriptionMessageSubscription = subscriptionMessageSource.listen(({type, target}) => {
            if(!managed){
                this.subscriptionMessageSubscription.cancel();
                return;
            }
            subscriptionCollection.addTargetForType(type, target);
        });
    }
    create(type){
        var target = new CrossBoundaryMessagesTarget(type);
        var source = new CrossBoundaryMessagesSource(type);
        return new CrossBoundaryEvent(target, source);
    }
    manageSubscriptions(){
        managed = true;
        tabRemoved.listen(() => subscriptionCollection.pruneSubscriptions());
        targetRequestSource.onMessage(({type}, sendResponse) => {
            subscriptionCollection.getTargetForType(type).then(sendResponse);
            return true;
        });
    }
}

var crossBoundaryEventFactory = new Factory();

export { crossBoundaryEventFactory }