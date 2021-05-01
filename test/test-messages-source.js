import { MessagesSource } from '../src/shared/events';

export class TestMessagesSource extends MessagesSource{
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