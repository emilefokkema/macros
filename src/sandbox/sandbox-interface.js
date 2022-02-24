import { WindowMessageBus } from '../shared/window-messages/window-message-bus';
import { MessageType } from '../shared/events';
import { MessageBusInterfaceForSandbox } from '../shared/message-bus/message-bus-interface-for-sandbox';
import { NavigationInterfaceForSandbox } from '../shared/navigation/navigation-interface-for-sandbox';
import { PageInterfaceForIframe } from './page-interface-for-iframe';
import { InspectedWindowForSandbox } from '../shared/inspected-window/inspected-window-for-sandbox';
import { BodyResizeObserver } from './body-resize-observer';
import { whenBodyExists } from './when-body-exists';

class BaseSandboxInterface{
    constructor(windowMessageBus){
        this.documentTitleChannel = windowMessageBus.createChannel(new MessageType('documentTitle'));
        this.bodySizeChannel = windowMessageBus.createChannel(new MessageType('bodySize'));
        this.messageBusChannelSubscriptionMessage = windowMessageBus.createChannel(new MessageType('messageBusChannelSubscription'));
        this.messageBusIntializeTargetRequest = windowMessageBus.createChannel(new MessageType('initializeTargetRequest'));
        this.navigationDisappearedMessage = windowMessageBus.createChannel(new MessageType('navigationDisappeared'));
        this.navigationExistsRequest = windowMessageBus.createChannel(new MessageType('navigationExists'));
        this.getNavigationPropertiesRequest = windowMessageBus.createChannel(new MessageType('navigationPropertiesRequest'));
        this.pushHistoryStateMessage = windowMessageBus.createChannel(new MessageType('pushHistoryState'));
        this.focusNavigationMessage = windowMessageBus.createChannel(new MessageType('focusNavigation'));
        this.popupTabIdMessage = windowMessageBus.createChannel(new MessageType('getPopupTabId'));
        this.getNavigationsForPopupMessage = windowMessageBus.createChannel(new MessageType('getNavigationsForPopup'));
        this.openTabMessage = windowMessageBus.createChannel(new MessageType('openTab'));
        this.inspectedWindowTabIdMessage = windowMessageBus.createChannel(new MessageType('inspectedWindowTabId'))
        this.closeWindowMessage = windowMessageBus.createChannel(new MessageType('closeWindow'));
        this.unsavedChangesWarningEnabledMessage = windowMessageBus.createChannel(new MessageType('unsavedChangesWarningEnabled'));
        this.copyToClipboardMessage = windowMessageBus.createChannel(new MessageType('copyToClipboard'));
        this.downloadJsonMessage = windowMessageBus.createChannel(new MessageType('downloadJson'))
        this.windowMessageBus = windowMessageBus;
    }
}

class SandboxInterfaceForParent extends BaseSandboxInterface{
    constructor(windowMessageBus, messageBus){
        super(windowMessageBus);
        MessageBusInterfaceForSandbox.initializeForParent(
            this.windowMessageBus,
            this.messageBusIntializeTargetRequest.source,
            this.messageBusChannelSubscriptionMessage.source,
            messageBus);
    }
    onDocumentTitleChanged(listener, cancellationToken){
        return this.documentTitleChannel.source.onMessage(listener, cancellationToken);
    }
    onWindowCloseRequested(listener, cancellationToken){
        return this.closeWindowMessage.source.onMessage(listener, cancellationToken);
    }
    onUnsavedChangesWarningEnabled(listener, cancellationToken){
        return this.unsavedChangesWarningEnabledMessage.source.onMessage(listener, cancellationToken);
    }
    onCopyToClipboardMessage(listener, cancellationToken){
        return this.copyToClipboardMessage.source.onMessage(listener, cancellationToken);
    }
    setNavigationDisappeared(navigationDisappearedEventSource){
        navigationDisappearedEventSource.listen(() => {
            this.navigationDisappearedMessage.target.sendMessage();
        });
    }
    onRequestToDownloadJson(listener, cancellationToken){
        return this.downloadJsonMessage.source.onMessage(listener, cancellationToken);
    }
    onRequestNavigationExists(listener, cancellationToken){
        return this.navigationExistsRequest.source.onMessage(listener, cancellationToken);
    }
    onRequestNavigationProperties(listener, cancellationToken){
        return this.getNavigationPropertiesRequest.source.onMessage(listener, cancellationToken);
    }
    onRequestToPushHistoryState(listener, cancellationToken){
        return this.pushHistoryStateMessage.source.onMessage(listener, cancellationToken);
    }
    onRequestToFocusNavigation(listener, cancellationToken){
        return this.focusNavigationMessage.source.onMessage(listener, cancellationToken);
    }
    onRequestNavigationsForPopup(listener, cancellationToken){
        return this.getNavigationsForPopupMessage.source.onMessage(listener, cancellationToken);
    }
    onRequestPopupTabId(listener, cancellationToken){
        return this.popupTabIdMessage.source.onMessage(listener, cancellationToken);
    }
    onBodySizeChange(listener, cancellationToken){
        return this.bodySizeChannel.source.onMessage(listener, cancellationToken);
    }
    onRequestToOpenTab(listener, cancellationToken){
        return this.openTabMessage.source.onMessage(listener, cancellationToken);
    }
    onRequestInspectedWindowTabId(listener, cancellationToken){
        return this.inspectedWindowTabIdMessage.source.onMessage(listener, cancellationToken);
    }
}

class SandboxInterfaceForIframe extends BaseSandboxInterface{
    constructor(windowMessageBus){
        super(windowMessageBus);
        this.setDocumentTitle(document.title);
        whenBodyExists().then(async () => {
            const resize = new BodyResizeObserver();
            do{
                await this.setBodySize();
                resize.start();
                await resize.debouncedResize.next();
                resize.stop();
            }while(true);           
        });
    }
    setDocumentTitle(title){
        this.documentTitleChannel.target.sendMessage(title);
    }
    setBodySize(){
        return this.bodySizeChannel.target.sendMessageAsync({width: document.body.scrollWidth, height: document.body.scrollHeight});
    }
    getMessageBus(){
        return MessageBusInterfaceForSandbox.createForIframe(this.windowMessageBus, this.messageBusIntializeTargetRequest.target, this.messageBusChannelSubscriptionMessage.target);
    }
    getNavigationInterface(){
        const navigationDisappearedMessageSource = this.navigationDisappearedMessage.source;
        const navigationExistsMessageTarget = this.navigationExistsRequest.target;
        const navigationPropsRequestTarget = this.getNavigationPropertiesRequest.target;
        const focusNavigationMessageTarget = this.focusNavigationMessage.target;
        const popupTabIdMessageTarget = this.popupTabIdMessage.target;
        const navigationsForPopupMessageTarget = this.getNavigationsForPopupMessage.target;
        const openTabMessageTarget = this.openTabMessage.target;
        return new NavigationInterfaceForSandbox(
            navigationDisappearedMessageSource,
            navigationExistsMessageTarget,
            navigationPropsRequestTarget,
            focusNavigationMessageTarget,
            popupTabIdMessageTarget,
            navigationsForPopupMessageTarget,
            openTabMessageTarget);
    }
    getPageInterface(){
        const documentTitleMessageTarget = this.documentTitleChannel.target;
        const historyStateMessageTarget = this.pushHistoryStateMessage.target;
        const closeWindowMessageTarget = this.closeWindowMessage.target;
        const unsavedChangesWarningEnabledMessageTarget = this.unsavedChangesWarningEnabledMessage.target;
        const downloadJsonMessageTarget = this.downloadJsonMessage.target;
        const copyToClipboardMessageTarget = this.copyToClipboardMessage.target;
        return new PageInterfaceForIframe(
            documentTitleMessageTarget,
            historyStateMessageTarget,
            closeWindowMessageTarget,
            unsavedChangesWarningEnabledMessageTarget,
            downloadJsonMessageTarget,
            copyToClipboardMessageTarget);
    }
    getInspectedWindow(){
        const inspectedWindowTabIdMessageTarget = this.inspectedWindowTabIdMessage.target;
        return new InspectedWindowForSandbox(inspectedWindowTabIdMessageTarget);
    }
}

export class SandboxInterface{
    static createForParent(iframeWindow, windowMessagesEventSource, messageBus){
        const windowMessageBus = WindowMessageBus.create(iframeWindow, windowMessagesEventSource);
        return new SandboxInterfaceForParent(windowMessageBus, messageBus);
    }
    static createForIframe(parentWindow, windowMessagesEventSource){
        const messageBus = WindowMessageBus.create(parentWindow, windowMessagesEventSource);
        return new SandboxInterfaceForIframe(messageBus);
    }
}