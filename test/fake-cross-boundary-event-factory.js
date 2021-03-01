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
    }
    sendMessageAsync(msg){
        return new Promise((resolve) => {
            let resolved = false;
            this.event.dispatch(msg, (response) => {
                if(resolved){
                    return;
                }
                resolved = true;
                resolve(response);
            });
        });
    }
    sendMessage(msg){
        this.event.dispatch(msg);
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