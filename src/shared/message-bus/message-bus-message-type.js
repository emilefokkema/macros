export class MessageBusMessageType{
    constructor(type){
        this.type = type;
    }
    filterMessage(msg){
        return msg.type === 'messageBusMessage' && msg.subType === this.type;
    }
    unpackMessage(msg){
        return msg.message;
    }
    packMessage(msg){
        return {
            type: 'messageBusMessage',
            subType: this.type,
            message: msg
        };
    }
    toString(){
        return `messageBus:${this.type}`;
    }
}