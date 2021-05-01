import { CombinedEventSource } from '../events';
import { Navigation } from './navigation';
import { getNavigationHistoryId, getNavigationId} from './navigation-ids';

export class NavigationEventProvider{
    constructor(
        runtimeMessagesEventSource,
        tabRemoved,
        webNavigationCommitted,
        historyStateUpdatedOrReferenceFragmentUpdated){
            this.navigationMessages = runtimeMessagesEventSource
                .filter((msg, sender) => !!sender.tab && sender.tab.id > 0)
                .map((msg, {frameId, tab, url}, sendResponse) => [msg, new Navigation(tab.id, frameId, url), sendResponse]);
            this.navigationCreated = webNavigationCommitted
                .filter(({tabId, frameId, url}) => tabId > 0)
                .map(({tabId, frameId, url}) => [new Navigation(tabId, frameId, url)]);
            this.navigationReplaced = historyStateUpdatedOrReferenceFragmentUpdated
                .map(({tabId, frameId, url}) => [{
                    navigationHistoryId: getNavigationHistoryId(tabId, frameId),
                    newNavigationId: getNavigationId(tabId, frameId, url)}]);
            this.navigationDisappeared = new CombinedEventSource([
                webNavigationCommitted,
                tabRemoved,
                historyStateUpdatedOrReferenceFragmentUpdated
            ]);
    }
}