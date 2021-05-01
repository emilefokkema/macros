import { MessagesTarget } from '../src/shared/events';

export class TestMessagesTarget extends MessagesTarget{
    constructor(event){
        super();
        this.event = event;
        this.messages = [];
    }
    expectMessage(predicate){
        let index = this.messages.findIndex(predicate || (() => true));
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
        if(args.length === 0){
            args = [undefined];
        }
        let message = {args};
        this.messages.push(message);
        this.event.dispatch(...args);
    }
}