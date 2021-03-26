import { EventSource } from './events';

class TabRemoved extends EventSource{
    addListener(listener){
        chrome.tabs.onRemoved.addListener(listener);
    }
    removeListener(listener){
        chrome.tabs.onRemoved.removeListener(listener);
    }
}

var tabRemoved = new TabRemoved();

export { tabRemoved };