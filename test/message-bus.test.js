import { FakeStorage } from './fake-storage';
import { FakeTabCollection } from './fake-tab-collection';
import { Event } from '../src/shared/events';
import { TestMessagesTarget } from './test-messages-target';
import { TestMessagesSource } from './test-messages-source';
import { FakeSenderIdentifier } from './fake-sender-identifier';
import { FakeNavigationEventProvider } from './fake-navigation-event-provider';
import { MessageBus } from '../src/shared/message-bus/message-bus';
import { FakeTabMessagesTargetFactory } from './fake-tab-messages-target-factory';
import { whenReturns } from './when-returns';

describe('given prerequisites', () => {
    let runtimeMessageEvent, 
        runtimeMessagesTarget,
        runtimeMessagesSource,
        navigationEventProvider,
        tabMessagesTargetFactory;

    beforeEach(() => {
        runtimeMessageEvent = new Event();
        runtimeMessagesTarget = new TestMessagesTarget(runtimeMessageEvent);
        runtimeMessagesSource = new TestMessagesSource(runtimeMessageEvent);
        navigationEventProvider = new FakeNavigationEventProvider();
        tabMessagesTargetFactory = new FakeTabMessagesTargetFactory();
    });

    describe('and a message bus for a non-background is created', () => {
        let messageBus, tabId;

        beforeEach(() => {
            tabId = 'tabId0';
            messageBus = MessageBus.create(runtimeMessagesTarget, runtimeMessagesSource, navigationEventProvider, tabMessagesTargetFactory);
        });

        describe('and a channel is created and subscribed to', () => {
            let messageType, receivedMessagePromise, subscriptionMessage;

            beforeEach(() => {
                messageType = 'someType';
                receivedMessagePromise = messageBus.createChannel(messageType).source.nextMessage();
                const {args: [m]} = runtimeMessagesTarget.expectMessage();
                subscriptionMessage = m;
            });

            it('should have sent a message about the desired subscription', () => {
                expect(subscriptionMessage).toBeTruthy();
            });

            describe('and a message bus and a channel for the background are created', () => {
                let messageBusForBackground,
                    channelForBackground,
                    storage,
                    tabCollection,
                    tabRemoved,
                    senderIdentifier,
                    backgroundRuntimeMessagesEventSource,
                    backgroundRuntimeMessageEvent,
                    backgroundRuntimeMessagesTarget,
                    backgroundRuntimeMessagesSource;

                beforeEach(() => {
                    backgroundRuntimeMessagesEventSource = new Event();
                    backgroundRuntimeMessageEvent = new Event();
                    backgroundRuntimeMessagesTarget = new TestMessagesTarget(backgroundRuntimeMessageEvent);
                    backgroundRuntimeMessagesSource = new TestMessagesSource(backgroundRuntimeMessageEvent);
                    storage = new FakeStorage();
                    tabCollection = new FakeTabCollection();
                    tabRemoved = new Event();
                    senderIdentifier = new FakeSenderIdentifier();
                    messageBusForBackground = MessageBus.createForBackground(
                        storage,
                        tabCollection,
                        backgroundRuntimeMessagesEventSource,
                        backgroundRuntimeMessagesTarget,
                        backgroundRuntimeMessagesSource,
                        senderIdentifier,
                        tabRemoved,
                        navigationEventProvider,
                        tabMessagesTargetFactory);
                    channelForBackground = messageBusForBackground.createChannel(messageType);
                });

                describe('and the subscription message is sent, along with information about the sender', () => {

                    beforeEach(async () => {
                        const whenSaved = whenReturns(storage, 'setItem');
                        const sender = {
                            tab: {
                                id: tabId
                            }
                        };
                        jest.spyOn(senderIdentifier, 'isExtension').mockImplementation(() => false);
                        backgroundRuntimeMessagesEventSource.dispatch(subscriptionMessage, sender);
                        await whenSaved;
                    });

                    it('should have saved it in storage', () => {
                        expect(storage.items['crossBoundarySubscriptions']).toEqual({[messageType]: [tabId]})
                    });

                    describe('and the tab disappears', () => {

                        beforeEach(async () => {
                            jest.spyOn(tabCollection, 'getAllTabs').mockImplementation(async () => []);
                            const whenSaved = whenReturns(storage, 'setItem');
                            tabRemoved.dispatch();
                            await whenSaved;
                            console.log(`saved after pruning`)
                        });

                        it('should have updated the storage accordingly', () => {
                            expect(storage.items['crossBoundarySubscriptions']).toEqual({[messageType]: []});
                        });
                    });

                    describe('and a message is sent from the background', () => {
                        let messageFromBackground, messageToTab;

                        beforeEach(async () => {
                            messageFromBackground = {foo: 9};
                            channelForBackground.target.sendMessage(messageFromBackground);
                            const tabMessagesTarget = tabMessagesTargetFactory.targets[tabId];
                            const {args: [m]} = tabMessagesTarget.expectMessage();
                            messageToTab = m;
                        });

                        it('should have sent a message to the tab', () => {
                            expect(messageToTab).toBeTruthy();
                        });

                        describe('and the message is received in the tab', () => {
                            let receivedMessage;

                            beforeEach(async () => {
                                runtimeMessageEvent.dispatch(messageToTab);
                                receivedMessage = await receivedMessagePromise;
                            });

                            it('the message should have been received', () => {
                                expect(receivedMessage).toEqual(messageFromBackground);
                            });
                        });
                    });
                });
            });
        });
    });

    describe('and a message bus for a non-background and a message bus for a tab are created', () => {
        let messageBus,
            messageBusForTab,
            tabRuntimeMessageEvent,
            tabRuntimeMessagesTarget,
            tabRuntimeMessagesSource,
            tabId;

        beforeEach(() => {
            tabId = 'tabId0';
            tabRuntimeMessageEvent = new Event();
            tabRuntimeMessagesTarget = new TestMessagesTarget(tabRuntimeMessageEvent);
            tabRuntimeMessagesSource = new TestMessagesSource(tabRuntimeMessageEvent);
            messageBus = MessageBus.create(runtimeMessagesTarget, runtimeMessagesSource, navigationEventProvider, tabMessagesTargetFactory);
            messageBusForTab = MessageBus.create(tabRuntimeMessagesTarget, tabRuntimeMessagesSource, navigationEventProvider, tabMessagesTargetFactory);
        });

        describe('and channels are created in the tab and in the non-background', () => {
            let sourceInTab, targetInNonBackground, messageType;

            beforeEach(() => {
                messageType = 'someType';
                sourceInTab = messageBusForTab.createChannel(messageType).source;
                targetInNonBackground = messageBus.createChannel(messageType).target;
            });

            describe('and the source in the tab is subscribed to', () => {
                let sentResponse, backgroundRuntimeMessagesTarget, receivedMessageInTab;

                beforeEach(async () => {
                    sentResponse = {bar: 3};
                    sourceInTab.onMessage((msg, sendResponse) => {
                        receivedMessageInTab = msg;
                        sendResponse(sentResponse);
                    });
                    const {args: [subscriptionMessage]} = tabRuntimeMessagesTarget.expectMessage();
                    const storage = new FakeStorage();
                    const tabCollection = new FakeTabCollection();
                    const tabRemoved = new Event();
                    const senderIdentifier = new FakeSenderIdentifier();
                    jest.spyOn(senderIdentifier, 'isExtension').mockImplementation(() => false);
                    const backgroundRuntimeMessagesEventSource = new Event();
                    const backgroundRuntimeMessageEvent = new Event();
                    backgroundRuntimeMessagesTarget = new TestMessagesTarget(backgroundRuntimeMessageEvent);
                    const backgroundRuntimeMessagesSource = new TestMessagesSource(backgroundRuntimeMessageEvent);
                    MessageBus.createForBackground(
                        storage,
                        tabCollection,
                        backgroundRuntimeMessagesEventSource,
                        backgroundRuntimeMessagesTarget,
                        backgroundRuntimeMessagesSource,
                        senderIdentifier,
                        tabRemoved,
                        navigationEventProvider,
                        tabMessagesTargetFactory);
                    const sender = {
                        tab: {
                            id: tabId
                        }
                    };
                    const whenSaved = whenReturns(storage, 'setItem');
                    backgroundRuntimeMessagesEventSource.dispatch(subscriptionMessage, sender);
                    await whenSaved;
                });

                describe('and a message is sent using the target in the non-background', () => {
                    let responsePromise, targetRequestMessage, respondToTargetRequest, sentMessage;

                    beforeEach(() => {
                        sentMessage = {foo: 9};
                        responsePromise = targetInNonBackground.sendMessageAsync(sentMessage);
                        ({args: [targetRequestMessage], sendResponse: respondToTargetRequest} = runtimeMessagesTarget.expectMessage());
                    });

                    it('the non-background should have sent a request to get the target tabs', () => {
                        expect(targetRequestMessage).toBeTruthy();
                    });

                    describe('and then the response to the request is received from the background', () => {
                        let responseFromBackground;

                        beforeEach(async () => {
                            responseFromBackground = await backgroundRuntimeMessagesTarget.sendMessageAsync(targetRequestMessage);
                        });

                        describe('and then the response is received in the non-background', () => {
                            let messageToTab, sendResponseFromTab;

                            beforeEach(async () => {
                                const whenTabMessagesTargetCreated = whenReturns(tabMessagesTargetFactory, 'createTarget');
                                respondToTargetRequest(responseFromBackground);
                                await whenTabMessagesTargetCreated;
                                ({args: [messageToTab], sendResponse: sendResponseFromTab} = tabMessagesTargetFactory.targets[tabId].expectMessage());
                            });

                            it('should have sent a message to the tab', () => {
                                expect(messageToTab).toBeTruthy();
                            });

                            describe('and then the response to the message is received from the tab', () => {
                                let responseFromTab;

                                beforeEach(async () => {
                                    responseFromTab = await tabRuntimeMessagesTarget.sendMessageAsync(messageToTab);
                                });

                                describe('and the response is received in the non-background', () => {
                                    let response;

                                    beforeEach(async () => {
                                        sendResponseFromTab(responseFromTab);
                                        response = await responsePromise;
                                    });

                                    it('should', () => {
                                        expect(receivedMessageInTab).toEqual(sentMessage);
                                        expect(response).toEqual(sentResponse);
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});