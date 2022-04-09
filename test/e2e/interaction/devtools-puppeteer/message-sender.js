class MessageSender{
    constructor(ws){
        this.ws = ws;
    }
    send(message){
        this.ws.send(JSON.stringify(message));
    }
}

module.exports = { MessageSender }