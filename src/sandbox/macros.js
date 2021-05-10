import { Macros } from '../shared/macros-class';
import { SandboxInterface } from './sandbox-interface';
import { WindowMessagesEventSource } from '../shared/window-messages/window-messages-event-source';

const sandboxInterface = SandboxInterface.createForIframe(parent, new WindowMessagesEventSource());
const messageBus = sandboxInterface.getMessageBus();
const navigation = sandboxInterface.getNavigationInterface();
const pageInterface = sandboxInterface.getPageInterface();
const inspectedWindow = sandboxInterface.getInspectedWindow();

const macros = new Macros(navigation, inspectedWindow, messageBus, pageInterface);

export {macros};