import { EventSource } from '../events';

export class WindowMessagesEventSource extends EventSource{
    addListener(listener){
        window.addEventListener('message', listener);
    }
    removeListener(listener){
        window.removeEventListener('message', listener);
    }
}