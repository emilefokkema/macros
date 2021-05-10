import { URLProvider } from '../shared/url-provider';
import { SandboxInterface } from './sandbox-interface';
import { WindowMessagesEventSource } from '../shared/window-messages/window-messages-event-source';
import { RuntimeMessagesTarget } from '../shared/messages/runtime-messages-target';
import { RuntimeMessagesSource } from '../shared/messages/runtime-messages-source';
import { RuntimeMessagesEventSource } from '../shared/messages/runtime-messages-event-source';
import { tabRemoved } from '../shared/tab-removed';
import { webNavigationCommitted, historyStateUpdatedOrReferenceFragmentUpdated } from '../shared/navigation/navigation-event-sources';
import { NavigationEventProvider } from '../shared/navigation/navigation-event-provider';
import { MessageBus } from '../shared/message-bus/message-bus';
import { TabMessagesTargetFactory } from '../shared/message-bus/tab-messages-target-factory';
import { TabCollection } from '../shared/tab-collection';
import { NavigationInterface } from '../shared/navigation/navigation-interface';
import { inspectedWindow } from '../shared/inspected-window/inspected-window';

const tabMessagesTargetFactory = new TabMessagesTargetFactory();
const runtimeMessagesTarget = new RuntimeMessagesTarget();
const runtimeMessagesEventSource = new RuntimeMessagesEventSource();
const runtimeMessagesSource = new RuntimeMessagesSource(runtimeMessagesEventSource);
const tabCollection = new TabCollection();
const navigationEventProvider = new NavigationEventProvider(runtimeMessagesEventSource, tabRemoved, webNavigationCommitted, historyStateUpdatedOrReferenceFragmentUpdated);
const messageBus = MessageBus.create(runtimeMessagesTarget, runtimeMessagesSource, navigationEventProvider, tabMessagesTargetFactory);
const navigation = NavigationInterface.create(
    messageBus,
    runtimeMessagesTarget,
    navigationEventProvider,
    tabCollection)

const iFrame = document.getElementById('iframe');
const sandboxInterface = SandboxInterface.createForParent(iFrame.contentWindow, new WindowMessagesEventSource(), messageBus);

sandboxInterface.onDocumentTitleChanged(title => document.title = title);
sandboxInterface.setNavigationDisappeared(navigationEventProvider.navigationDisappeared);
sandboxInterface.onRequestNavigationExists(async (navigationId, sendResponse) => {
    sendResponse(await navigation.navigationExists(navigationId));
});
sandboxInterface.onRequestNavigationProperties(async (navigationId, sendResponse) => {
    const {id, historyId, url, tabId, frameId} = await navigation.getNavigation(navigationId);
    sendResponse({id, historyId, url, tabId, frameId});
});
sandboxInterface.onRequestToPushHistoryState((newUrlString, sendResponse) => {
    const newUrl = new URL(newUrlString);
    const newPage = (newUrl.pathname + newUrl.search).replace(/^\//g,'');
    const url = new URL(location.href);
    url.searchParams.set('page', newPage);
    const urlString = url.toString();
    history.pushState('',{}, urlString);
    sendResponse();
});
sandboxInterface.onRequestToFocusNavigation(async (navigationId) => {
    const _navigation = await navigation.getNavigation(navigationId);
    if(!_navigation){
        return;
    }
    _navigation.focus();
});
sandboxInterface.onRequestPopupTabId(async (_, sendResponse) => {
    sendResponse(await navigation.getPopupTabId());
});
sandboxInterface.onBodySizeChange(({width, height}, sendResponse) => {
    document.body.style.width = width + 'px';
    document.body.style.height = (height + 1) + 'px';
    sendResponse();
});
sandboxInterface.onRequestToOpenTab((url) => {
    navigation.openTab(url);
});
sandboxInterface.onRequestInspectedWindowTabId(async (_, sendResponse) => {
    sendResponse(await inspectedWindow.getTabId());
});

const urlProvider = new URLProvider();
const page = new URL(location.href).searchParams.get('page');
const url = urlProvider.getURL(page);
iFrame.src = url;