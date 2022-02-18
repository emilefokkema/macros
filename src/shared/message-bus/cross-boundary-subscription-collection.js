import { CombinedMessagesTarget } from './combined-messages-target';

export class CrossBoundarySubscriptionCollection{
    constructor(storage, tabCollection, runtimeMessagesTarget, tabMessagesTargetFactory){
        this.storage = storage;
        this.tabCollection = tabCollection;
        this.runtimeMessagesTarget = runtimeMessagesTarget;
        this.tabMessagesTargetFactory = tabMessagesTargetFactory;
        this.loaded = false;
        this.subscriptions = {};
    }
    async pruneSubscriptions(){
        this.ensureLoaded();
        const existingTabIds = (await this.tabCollection.getAllTabs()).map(t => t.id);
        for(let type of Object.getOwnPropertyNames(this.subscriptions)){
            const target = this.subscriptions[type];
            if(!target){
                continue;
            }
            target.prune(existingTabIds);
        }
        this.save();
    }
    async ensureLoaded(){
        if(this.loaded){
            return;
        }
        const serialized = await this.storage.getItem('crossBoundarySubscriptions');
        if(serialized){
            for(let type of Object.getOwnPropertyNames(serialized)){
                const combinedTarget = CombinedMessagesTarget.create(serialized[type], this.runtimeMessagesTarget, this.tabMessagesTargetFactory);
                combinedTarget.updated.listen(() => this.save());
                this.subscriptions[type] = combinedTarget;
            }
        }
        this.loaded = true;
    }
    async save(){
        await this.storage.setItem('crossBoundarySubscriptions', this.serialize());
    }
    serialize(){
        const result = {};
        for(let type of Object.getOwnPropertyNames(this.subscriptions)){
            const target = this.subscriptions[type];
            if(!target){
                continue;
            }
            const serializedTarget = target.serialize();
            result[type] = serializedTarget;
        }
        return result;
    }
    async addTargetForType(type, target){
        await this.ensureLoaded();
        let combinedTarget = this.subscriptions[type];
        if(!combinedTarget){
            combinedTarget = new CombinedMessagesTarget([], this.runtimeMessagesTarget);
            combinedTarget.updated.listen(() => this.save());
            this.subscriptions[type] = combinedTarget;
        }
        combinedTarget.addTarget(target);
    }
    async getTargetForType(type){
        await this.ensureLoaded();
        return this.subscriptions[type] || new CombinedMessagesTarget([], this.runtimeMessagesTarget);
    }
}