import { MessagesTarget, Event } from '../events';

export class CombinedMessagesTarget extends MessagesTarget{
    constructor(tabMessagesTargets, runtimeMessagesTarget){
        super();
        this.tabMessagesTargets = tabMessagesTargets;
        this.runtimeMessagesTarget = runtimeMessagesTarget;
        this.updated = new Event();
    }
    prune(existingTabIds){
        this.tabMessagesTargets = this.tabMessagesTargets.filter(target => existingTabIds.indexOf(target.tabId) !== -1);
    }
    getTargets(){
		return [this.runtimeMessagesTarget].concat(this.tabMessagesTargets);
	}
    sendMessageAsync(msg){
        return new Promise((resolve) => {
            var targets = this.getTargets();
            for(let target of targets){
                target.sendMessageAsync(msg).then(v => resolve(v), e => {});
            }
        });
    }
    sendMessage(msg){
		for(var target of this.getTargets()){
			target.sendMessage(msg);
		}
	}
    serialize(){
        return this.tabMessagesTargets.map(target => target.tabId);
    }
    addTarget(target){
        if(!this.tabMessagesTargets.some(tt => tt.tabId === target.tabId)){
			this.tabMessagesTargets.push(target);
			this.updated.dispatch();
		}
    }
    static create(serialized, runtimeMessagesTarget, tabMessagesTargetFactory){
        const targets = serialized.map(tabId => tabMessagesTargetFactory.createTarget(tabId));
        return new CombinedMessagesTarget(targets, runtimeMessagesTarget);
    }
}