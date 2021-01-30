import { EventSource, CombinedEventSource } from '../events';

class WebNavigationCommitted extends EventSource{
    addListener(listener){
        chrome.webNavigation.onCommitted.addListener(listener);
    }
    removeListener(listener){
        chrome.webNavigation.onCommitted.removeListener(listener);
    }
}

class HistoryStateUpdated extends EventSource{
    addListener(listener){
        chrome.webNavigation.onHistoryStateUpdated.addListener(listener);
    }
    removeListener(listener){
        chrome.webNavigation.onHistoryStateUpdated.removeListener(listener);
    }
}

class ReferenceFragmentUpdated extends EventSource{
    addListener(listener){
        chrome.webNavigation.onReferenceFragmentUpdated.addListener(listener);
    }
    removeListener(listener){
        chrome.webNavigation.onReferenceFragmentUpdated.removeListener(listener);
    }
}

var webNavigationCommitted = new WebNavigationCommitted();
var historyStateUpdated = new HistoryStateUpdated();
var referenceFragmentUpdated = new ReferenceFragmentUpdated();
var historyStateUpdatedOrReferenceFramentUpdated = new CombinedEventSource([historyStateUpdated, referenceFragmentUpdated]);

export {webNavigationCommitted, historyStateUpdatedOrReferenceFramentUpdated};