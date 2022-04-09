class Channel{
    constructor(messages, sender){
        this.destroyed = false;
        this.sender = sender;
        this.pendingRequests = new Map();
        this._onMessageCallback = () => {};
        this.messages = messages;
        this.messageListener = (data) => {
            let pendingRequest;
            if(data.id === undefined || !(pendingRequest = this.pendingRequests.get(data.id))){
                this.dispatchMessage(data);
                return;
            }
            this.pendingRequests.delete(data.id);
            pendingRequest.resolve(data);
        };
        this.messages.addListener(this.messageListener);
    }
    set onmessage(value){
        this._onMessageCallback = value;
    }
    sendRequest(request){
        if(this.destroyed){
            return Promise.reject('cannot send message through closed channel');
        }
        return new Promise((resolve) => {
            this.pendingRequests.set(request.id, {resolve});
            this.sender.send(request);
        });
    }
    dispatchMessage(message){
        this._onMessageCallback(message);
    }
    destroy(){
        if(this.destroyed){
            return;
        }
        this.messages.removeListener(this.messageListener);
        this.destroyed = true;
    }
}

module.exports = { Channel }