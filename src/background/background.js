import { setPopup } from './set-popup';
import { storage } from '../shared/storage';
import { buttonInteraction } from './button-interaction';
import { backgroundScript } from './background-script-function';
import { NavigationInterface } from '../shared/navigation/navigation-interface';
import { NavigationEventProvider } from '../shared/navigation/navigation-event-provider';
import { RuntimeMessagesEventSource } from '../shared/messages/runtime-messages-event-source';
import { RuntimeMessagesSource } from '../shared/messages/runtime-messages-source';
import { RuntimeMessagesTarget } from '../shared/messages/runtime-messages-target';
import { tabRemoved } from '../shared/tab-removed';
import { webNavigationCommitted, historyStateUpdatedOrReferenceFragmentUpdated } from '../shared/navigation/navigation-event-sources';
import { TabCollection } from '../shared/tab-collection';
import { MessageBus } from '../shared/message-bus/message-bus';
import { SenderIdentifier } from '../shared/message-bus/sender-identifier';
import { TabMessagesTargetFactory } from '../shared/message-bus/tab-messages-target-factory';

const tabMessagesTargetFactory = new TabMessagesTargetFactory();
const runtimeMessagesEventSource = new RuntimeMessagesEventSource();
const runtimeMessagesSource = new RuntimeMessagesSource(runtimeMessagesEventSource);
const runtimeMessagesTarget = new RuntimeMessagesTarget();
const senderIdentifier = new SenderIdentifier();
const tabCollection = new TabCollection();
const navigationEventProvider = new NavigationEventProvider(runtimeMessagesEventSource, tabRemoved, webNavigationCommitted, historyStateUpdatedOrReferenceFragmentUpdated);
const messageBus = MessageBus.createForBackground(
    storage,
    tabCollection,
    runtimeMessagesEventSource,
    runtimeMessagesTarget,
    runtimeMessagesSource,
    senderIdentifier,
    tabRemoved,
    navigationEventProvider,
    tabMessagesTargetFactory);
const navigation = NavigationInterface.createForBackground(
    messageBus,
    runtimeMessagesEventSource,
    navigationEventProvider,
    runtimeMessagesTarget,
    tabCollection);

const { addRule } = backgroundScript(setPopup, storage, buttonInteraction, navigation, messageBus);

export { addRule }