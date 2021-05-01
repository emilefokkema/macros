import { TestMessagesTarget } from './test-messages-target';
import { Event } from '../src/shared/events';

class TestTabMessagesTarget extends TestMessagesTarget{
    constructor(event, tabId){
        super(event);
        this.tabId = tabId;
    }
}

export class FakeTabMessagesTargetFactory{
    constructor(){
        this.targets = {};
    }
    createTarget(tabId){
        const result = new TestTabMessagesTarget(new Event(), tabId);
        this.targets[tabId] = result;
        return result;
    }
}