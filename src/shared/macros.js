import { inspectedWindow } from './inspected-window';
import { Macros } from './macros-class';
import { NavigationInterface } from './navigation/navigation-interface';
import { NavigationEventProvider } from './navigation/navigation-event-provider';
import { RuntimeMessagesTarget } from './messages/runtime-messages-target';
import { RuntimeMessagesEventSource } from './messages/runtime-messages-event-source';
import { RuntimeMessagesSource } from './messages/runtime-messages-source';
import { tabRemoved } from './tab-removed';
import { webNavigationCommitted, historyStateUpdatedOrReferenceFragmentUpdated } from './navigation/navigation-event-sources';
import { TabCollection } from './tab-collection';
import { MessageBus } from './message-bus/message-bus';
import { TabMessagesTargetFactory } from './message-bus/tab-messages-target-factory';

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

var macros = new Macros(navigation, inspectedWindow, messageBus);

export {macros};