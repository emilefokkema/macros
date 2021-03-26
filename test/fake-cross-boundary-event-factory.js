import { MessagesSource, MessagesTarget, Event } from '../src/shared/events';

class Source extends MessagesSource{
    constructor(event){
        super();
        this.event = event;
    }
    onMessage(listener, cancellationToken){
        return this.event.listen(listener, cancellationToken);
    }
    onMessageFromNavigation(listener, cancellationToken){
        return this.event.listen(listener, cancellationToken);
    }
}

class Target extends MessagesTarget{
    constructor(event){
        super();
        this.event = event;
        this.messages = [];
    }
    expectMessage(predicate){
        let index = this.messages.findIndex(predicate);
        if(index === -1){
            throw new Error('expected a message matching the predicate, but none was found');
        }
        let [result] = this.messages.splice(index, 1);
        return result;
    }
    sendMessageAsync(...args){
        if(args.length === 0){
            args = [undefined];
        }
        let message = {args};
        this.messages.push(message);
        return new Promise((resolve) => {
            let resolved = false;
            let sendResponse = (response) => {
                if(resolved){
                    return;
                }
                resolved = true;
                resolve(response);
            };
            message.sendResponse = sendResponse;
            this.event.dispatch(...args, sendResponse);
        });
    }
    sendMessage(...args){
        this.event.dispatch(...args);
    }
}

class SourceAndTarget{
    constructor(){
        this.event = new Event();
        this.source = new Source(this.event);
        this.target = new Target(this.event);
    }
}

export class FakeCrossBoundaryEventFactory{
    constructor(){
        this.isManaging = false;
        this.events = {};
    }
    create(type){
        const result = new SourceAndTarget();
        this.events[type] = result;
        return result;
    }
    manageSubscriptions(){
        this.isManaging = true;
    }
}