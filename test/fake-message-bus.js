import { Event } from '../src/shared/events';
import { TestMessagesTarget } from './test-messages-target';
import { TestMessagesSource } from './test-messages-source';

class SourceAndTarget{
    constructor(){
        this.event = new Event();
        this.source = new TestMessagesSource(this.event);
        this.target = new TestMessagesTarget(this.event);
    }
}

export class FakeMessageBus{
    constructor(){
        this.channels = {};
    }
    createChannel(type){
        const result = new SourceAndTarget();
        this.channels[type] = result;
        return result;
    }
}