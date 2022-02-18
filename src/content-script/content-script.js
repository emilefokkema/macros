import { contentScriptFunction } from './content-script-function';
import { documentMutationsProvider } from './document-mutations-provider';
import { RuntimeMessagesTarget } from '../shared/messages/runtime-messages-target';
import { RuntimeMessagesSource } from '../shared/messages/runtime-messages-source';
import { RuntimeMessagesEventSource } from '../shared/messages/runtime-messages-event-source';
import { NavigationInterface } from '../shared/navigation/navigation-interface';
import { NavigationEventProvider } from '../shared/navigation/navigation-event-provider';
import { tabRemoved } from '../shared/tab-removed';
import { webNavigationCommitted, historyStateUpdatedOrReferenceFragmentUpdated } from '../shared/navigation/navigation-event-sources';
import { TabCollection } from '../shared/tab-collection';
import { MessageBus } from '../shared/message-bus/message-bus';
import { TabMessagesTargetFactory } from '../shared/message-bus/tab-messages-target-factory';

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

const {onElementSelectedInDevtools, debugSuggestionsForElement, getElementSelectedInDevtools} = contentScriptFunction(navigation, messageBus, documentMutationsProvider);

export {onElementSelectedInDevtools, debugSuggestionsForElement, getElementSelectedInDevtools};
