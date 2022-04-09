const WebSocket = require('ws');
const { named, pipe, filter } = require('./events');
const { Channel } = require('./channel');
const { MessageSender } = require('./message-sender');

class ProxyTransport{
    constructor(ws, requestInterceptors, eventInterceptors){
        this.requestInterceptors = requestInterceptors;
        this.eventInterceptors = eventInterceptors;
        this.ws = ws;
        this.sessions = new Map();
        this.sender = new MessageSender(ws);
        this._onMessageCallback = () => {};
        this._onCloseCallback = () => {};
        ws.on('close', () => this.dispatchClose());
        this.wsMessages = pipe(named(ws, 'message'), listener => (m) => {
            const messageString = m.toString();
            listener(JSON.parse(messageString));
        });
        const wsMessagesWithoutSession = filter(this.wsMessages, (data) => data.sessionId === undefined);
        this.wsMessages.addListener((data) => {
            if(data.sessionId === undefined || this.sessions.has(data.sessionId)){
                return;
            }
            this.createSession(data.sessionId)
            this.handleMessage(data);
        });
        this.channel = new Channel(wsMessagesWithoutSession, this.sender);
        this.channel.onmessage = (message) => this.handleMessage(message);
        
    }
    set onclose(value){
        this._onCloseCallback = value;
    }
    set onmessage(value){
        this._onMessageCallback = value;
    }
    async send(message){
        const parsedMessage = JSON.parse(message);
        const channel = this.getOrCreateChannelForMessage(parsedMessage);
        const response = await channel.sendRequest(parsedMessage);
        this.dispatchMessage(response);
    }
    getOrCreateChannelForMessage(message){
        if(message.sessionId === undefined){
            return this.channel;
        }
        const sessionId = message.sessionId;
        let existingSession = this.sessions.get(sessionId);
        if(existingSession){
            return existingSession;
        }
        return this.createSession(sessionId);
    }
    removeSession(sessionId){
        const session = this.sessions.get(sessionId);
        if(!session){
            console.log(`session ${sessionId} already gone or never created`)
            return;
        }
        this.sessions.delete(sessionId);
        session.destroy();
    }
    createSession(sessionId){
        const wsMessagesWithSession = filter(this.wsMessages, (data) => data.sessionId === sessionId);
        const session = new Channel(wsMessagesWithSession, this.sender);
        session.onmessage = (message) => this.handleMessage(message);
        this.sessions.set(sessionId, session);
        return session;
    }
    close(){
        return this.ws.close();
    }
    dispatchClose(){
        this._onCloseCallback();
    }
    handleMessage(message){
        if(message.method === 'Target.detachedFromTarget'){
            this.removeSession(message.params.sessionId)
        }
        const interceptor = this.findInterceptorForEventMessage(message);
        if(!interceptor){
            this.dispatchMessage(message)
        }else{
            interceptor.intercept(message, newMessage => this.dispatchMessage(newMessage))
        }
    }
    findInterceptorForEventMessage(message){
        for(let eventInterceptor of this.eventInterceptors){
            if(eventInterceptor.shouldIntercept(message)){
                return eventInterceptor;
            }
        }
        return null;
    }
    dispatchMessage(message){
        const stringifiedMessage = JSON.stringify(message);
        this._onMessageCallback(stringifiedMessage);
    }
    static async create(wsEndpoint, interceptionOptions){
        const ws = new WebSocket(wsEndpoint, {perMessageDeflate: false});
        await new Promise(resolve => ws.once('open', resolve));
        const requestInterceptors = interceptionOptions && interceptionOptions.requestInterceptors || [];
        const eventInterceptors = interceptionOptions && interceptionOptions.eventInterceptors || [];
        return new ProxyTransport(ws, requestInterceptors, eventInterceptors);
    }
}

module.exports = { ProxyTransport }