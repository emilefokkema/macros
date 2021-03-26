import { EventSource } from '../shared/events';

class ElementSelectionChanged extends EventSource{
    addListener(listener){
        chrome.devtools.panels.elements.onSelectionChanged.addListener(listener);
    }
    removeListener(listener){
        chrome.devtools.panels.elements.onSelectionChanged.removeListener(listener);
    }
}

var elementSelectionChanged = new ElementSelectionChanged();

export { elementSelectionChanged };