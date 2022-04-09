class NamedEventSource{
    constructor(eventEmitter, eventName){
        this.eventEmitter = eventEmitter;
        this.eventName = eventName;
    }
    addListener(listener){
        this.eventEmitter.addListener(this.eventName, listener);
    }
    removeListener(listener){
        this.eventEmitter.removeListener(this.eventName, listener);
    }
}

class Pipe{
    constructor(eventSource, listenerMapper){
        this.eventSource = eventSource;
        this.listenerMapper = listenerMapper;
        this.listeners = [];
    }
    addListener(listener){
        const mappedListener = this.listenerMapper(listener);
        this.listeners.push({listener, mappedListener});
        this.eventSource.addListener(mappedListener);
    }
    removeListener(listener){
        const index = this.listeners.findIndex(({listener: _listener}) => _listener === listener);
        if(index === -1){
            return;
        }
        const [{mappedListener}] = this.listeners.splice(index, 1);
        return this.eventSource.removeListener(mappedListener);
    }
}

function pipe(eventSource, listenerMapper){
    return new Pipe(eventSource, listenerMapper);
}

function filter(eventSource, predicate){
    return pipe(eventSource, listener => (...args) => {
        if(predicate(...args)){
            listener(...args);
        }
    });
}

function next(eventSource){
    return new Promise(res => {
        const listener = (...args) => {
            eventSource.removeListener(listener);
            res(args);
        };
        eventSource.addListener(listener);
    });
}

function named(eventEmitter, eventName){
    return new NamedEventSource(eventEmitter, eventName);
}

module.exports = { named, filter, pipe, next }