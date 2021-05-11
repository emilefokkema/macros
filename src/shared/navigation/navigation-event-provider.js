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
                .map((msg, {frameId, tab, url}, sendResponse) => [msg, new Navigation(tab.id, frameId, tab.url), sendResponse]);
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