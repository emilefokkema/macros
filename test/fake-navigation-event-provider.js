import { Event } from '../src/shared/events';

export class FakeNavigationEventProvider{
    constructor(){
        this.navigationMessages = new Event();
        this.navigationReplaced = new Event();
        this.navigationDisappeared = new Event();
    }
}