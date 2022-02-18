import { contentScriptFunction } from '../src/content-script/content-script-function';
import { FakeNavigationInterface } from './fake-navigation-interface';
import { FakeMessageBus } from './fake-message-bus';
import { Event } from '../src/shared/events';

describe('given navigation, etc', () => {
    let navigationInterface;
    let messageBus;
    let currentNavigation;
    let url;
    let documentMutationsProvider;
    let documentMutationOccurred;

    beforeEach(() => {
        documentMutationOccurred = new Event();
        documentMutationsProvider = {
            getMutations(){
                return documentMutationOccurred;
            }
        };
        url = 'http://a.b/c';
        jest.spyOn(global, 'location', 'get').mockImplementation(() => {
            return {
                href: url
            };
        });
        currentNavigation = {
            id: 'nav0',
            historyId: 'history0',
            tabId: 3
        };
        navigationInterface = new FakeNavigationInterface();
        jest.spyOn(navigationInterface, 'getCurrent').mockImplementation(async () => currentNavigation);
        messageBus = new FakeMessageBus();
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('and there is an element for a selector', () => {
        let selector;
        let removeSpy;
        let div;

        beforeEach(() => {
            selector = 'div';
            div = document.createElement('div');
            removeSpy = jest.spyOn(div, 'remove');
            document.body.append(div);
        })

        describe('and the content script has executed', () => {
            let onElementSelectedInDevtools;

            beforeEach(() => {
                const result = contentScriptFunction(navigationInterface, messageBus, documentMutationsProvider);
                onElementSelectedInDevtools = result.onElementSelectedInDevtools;
            });

            describe('and an automatically deleting rule is returned', () => {
                let existingRuleForUrl;
                let ruleStateForNavigationChangedNotification;

                beforeEach(async () => {
                    existingRuleForUrl = {
                        id: 1,
                        name: 'rule',
                        automatic: true,
                        actions: [
                            {
                                type: 'select',
                                selector: selector,
                                action: {
                                    type: 'delete'
                                }
                            }
                        ]
                    };
                    const message = messageBus.channels['requestRulesForUrl'].target.expectMessage(m => true);
                    const ruleStateForNavigationChangedNotificationPromise = messageBus.channels['ruleStateForNavigationChangeNotification'].source.nextMessage();
                    messageBus.channels['requestEditableStatus'].source.onMessage((msg, sendResponse) => {
                        sendResponse(true)
                    });
                    messageBus.channels['draftRuleForNavigationRequest'].source.onMessage((msg, sendResponse) => {
                        sendResponse({
                            name: 'draft',
                            actions: []
                        });
                    });
                    message.sendResponse([existingRuleForUrl]);
                    ruleStateForNavigationChangedNotification = await ruleStateForNavigationChangedNotificationPromise;
                });

                it('should have emitted a notification that the rule has executed', () => {
                    expect(ruleStateForNavigationChangedNotification).toEqual({
                        navigationId: currentNavigation.id,
                        state: {
                            editable: true,
                            effectsOnElement: [],
                            hasExecuted: true,
                            hasSomethingToDo: false,
                            id: existingRuleForUrl.id,
                            name: existingRuleForUrl.name
                        }
                    })
                });

                it('should have removed the element', () => {
                    expect(removeSpy).toHaveBeenCalled();
                });

                describe('and then a dom mutation is emitted', () => {
                    let newNotification;

                    beforeEach(async () => {
                        const notificationPromise = messageBus.channels['notifyRulesForNavigation'].source.nextMessage();
                        documentMutationOccurred.dispatch();
                        newNotification = await notificationPromise;
                    });

                    it('should have emitted a new notification', () => {
                        expect(newNotification).toEqual({
                            navigationId: currentNavigation.id,
                            url: url,
                            tabId: currentNavigation.tabId,
                            rules: [
                                {
                                    name: existingRuleForUrl.name,
                                    id: existingRuleForUrl.id,
                                    hasSomethingToDo: false,
                                    hasExecuted: true
                                }
                            ],
                            numberOfRules: 1,
                            numberOfRulesThatHaveSomethingToDo: 0,
                            numberOfRulesThatHaveExecuted: 1
                        });
                    });

                    describe('and a rule is deleted', () => {
                        let newNotification;
    
                        beforeEach(async () => {
                            const notificationPromise = messageBus.channels['notifyRulesForNavigation'].source.nextMessage();
                            messageBus.channels['notifyRuleDeleted'].target.sendMessage({ruleId: existingRuleForUrl.id});
                            newNotification = await notificationPromise;
                        });
    
                        it('should have emitted a new notification', () => {
                            expect(newNotification).toEqual({
                                navigationId: currentNavigation.id,
                                url: url,
                                tabId: currentNavigation.tabId,
                                rules: [],
                                numberOfRules: 0,
                                numberOfRulesThatHaveSomethingToDo: 0,
                                numberOfRulesThatHaveExecuted: 0
                            });
                        });
                    });
                });
            });

            describe('and a deleting rule is returned', () => {
                let existingRuleForUrl;
                let notification;

                beforeEach(async () => {
                    existingRuleForUrl = {
                        id: 1,
                        name: 'rule',
                        automatic: false,
                        actions: [
                            {
                                type: 'select',
                                selector: selector,
                                action: {
                                    type: 'delete'
                                }
                            }
                        ]
                    };
                    const message = messageBus.channels['requestRulesForUrl'].target.expectMessage(m => true);
                    const notificationPromise = messageBus.channels['notifyRulesForNavigation'].source.nextMessage();
                    messageBus.channels['requestEditableStatus'].source.onMessage((msg, sendResponse) => {
                        sendResponse(true)
                    });
                    messageBus.channels['draftRuleForNavigationRequest'].source.onMessage((msg, sendResponse) => {
                        sendResponse({
                            name: 'draft',
                            actions: []
                        });
                    });
                    message.sendResponse([existingRuleForUrl]);
                    notification = await notificationPromise;
                });

                it('should have emitted a notification', () => {
                    expect(notification).toEqual({
                        navigationId: currentNavigation.id,
                        url: url,
                        tabId: currentNavigation.tabId,
                        rules: [
                            {
                                name: existingRuleForUrl.name,
                                id: existingRuleForUrl.id,
                                hasSomethingToDo: true,
                                hasExecuted: false
                            }
                        ],
                        numberOfRules: 1,
                        numberOfRulesThatHaveSomethingToDo: 1,
                        numberOfRulesThatHaveExecuted: 0
                    })
                });

                describe('and then the rule is updated', () => {
                    let newNotification;

                    beforeEach(async () => {
                        const otherSelector = 'a';
                        existingRuleForUrl.actions[0].selector = otherSelector;
                        messageBus.channels['notifyRuleUpdated'].target.sendMessage({ruleId: existingRuleForUrl.id});
                        const message = messageBus.channels['requestRulesForUrl'].target.expectMessage(m => true);
                        const notificationPromise = messageBus.channels['notifyRulesForNavigation'].source.nextMessage();
                        message.sendResponse([existingRuleForUrl]);
                        newNotification = await notificationPromise;
                    });

                    it('should have emitted a new notification', () => {
                        expect(newNotification).toEqual({
                            navigationId: currentNavigation.id,
                            url: url,
                            tabId: currentNavigation.tabId,
                            rules: [
                                {
                                    name: existingRuleForUrl.name,
                                    id: existingRuleForUrl.id,
                                    hasSomethingToDo: false,
                                    hasExecuted: false
                                }
                            ],
                            numberOfRules: 1,
                            numberOfRulesThatHaveSomethingToDo: 0,
                            numberOfRulesThatHaveExecuted: 0
                        });
                    });
                });

                describe('and then a matching element is selected in devtools', () => {
                    let notification;
    
                    beforeEach(async () => {
                        const notificationPromise = messageBus.channels['ruleStateForNavigationChangeNotification'].source.nextMessage();
                        onElementSelectedInDevtools(div);
                        notification = await notificationPromise;
                    });
    
                    it('should have emitted a notification', () => {
                        expect(notification).toEqual({
                            navigationId: currentNavigation.id,
                            state: {
                                editable: true,
                                effectsOnElement: [
                                    {
                                        actionDefinition: {
                                            type: 'delete'
                                        },
                                        description: 'will delete this element'
                                    }
                                ],
                                hasExecuted: false,
                                hasSomethingToDo: true,
                                id: existingRuleForUrl.id,
                                name: existingRuleForUrl.name
                            }
                        });
                    });
                });

                describe('and a delete action is executed', () => {

                    beforeEach(async () => {
                        await messageBus.channels['executeAction'].target.sendMessageAsync({
                            navigationId: currentNavigation.id,
                            action: {
                                type: 'select',
                                selector,
                                action: {
                                    type: 'delete'
                                }
                            }
                        });
                    });

                    it('should have deleted the element', () => {
                        expect(removeSpy).toHaveBeenCalled();
                    });
                });

                describe('and notification is given that a rule has been added', () => {

                    beforeEach(() => {
                        messageBus.channels['notifyRuleAdded'].target.sendMessage();
                    });

                    describe('and one more rule is returned', () => {
                        let newNotification;
                        let addedRule;
                        let addedRuleSelector;

                        beforeEach(async () => {
                            addedRuleSelector = 'a';
                            addedRule = {
                                id: 2,
                                name: 'addedRule',
                                automatic: false,
                                actions: [
                                    {
                                        type: 'select',
                                        selector: addedRuleSelector,
                                        action: {
                                            type: 'delete'
                                        }
                                    }
                                ]
                            };
                            const message = messageBus.channels['requestRulesForUrl'].target.expectMessage(m => true);
                            const notificationPromise = messageBus.channels['notifyRulesForNavigation'].source.nextMessage();
                            message.sendResponse([
                                existingRuleForUrl,
                                addedRule
                            ]);
                            newNotification = await notificationPromise;
                        });

                        it('should have emitted a new notification', () => {
                            expect(newNotification).toEqual({
                                navigationId: currentNavigation.id,
                                url: url,
                                tabId: currentNavigation.tabId,
                                rules: [
                                    {
                                        name: existingRuleForUrl.name,
                                        id: existingRuleForUrl.id,
                                        hasSomethingToDo: true,
                                        hasExecuted: false
                                    },
                                    {
                                        name: addedRule.name,
                                        id: addedRule.id,
                                        hasSomethingToDo: false,
                                        hasExecuted: false
                                    }
                                ],
                                numberOfRules: 2,
                                numberOfRulesThatHaveSomethingToDo: 1,
                                numberOfRulesThatHaveExecuted: 0
                            });
                        });
                    });
                });

                describe('and the navigation is replaced', () => {
                    let newNavigationId;

                    beforeEach(() => {
                        newNavigationId = 'nav1';
                        navigationInterface.navigationHasBeenReplaced.dispatch({
                            navigationHistoryId: currentNavigation.historyId,
                            newNavigationId: newNavigationId
                        });
                    });

                    describe('and zero new rules are returned', () => {
                        let newNotification;

                        beforeEach(async () => {
                            const message = messageBus.channels['requestRulesForUrl'].target.expectMessage(m => true);
                            const notificationPromise = messageBus.channels['notifyRulesForNavigation'].source.nextMessage();
                            message.sendResponse([]);
                            newNotification = await notificationPromise;
                        });

                        it('should have emitted a new notification', () => {
                            expect(newNotification).toEqual({
                                navigationId: newNavigationId,
                                url: url,
                                tabId: currentNavigation.tabId,
                                rules: [],
                                numberOfRules: 0,
                                numberOfRulesThatHaveSomethingToDo: 0,
                                numberOfRulesThatHaveExecuted: 0
                            });
                        });
                    });
                });

                describe('and a rule is deleted', () => {
                    let newNotification;

                    beforeEach(async () => {
                        const notificationPromise = messageBus.channels['notifyRulesForNavigation'].source.nextMessage();
                        messageBus.channels['notifyRuleDeleted'].target.sendMessage({ruleId: existingRuleForUrl.id});
                        newNotification = await notificationPromise;
                    });

                    it('should have emitted a new notification', () => {
                        expect(newNotification).toEqual({
                            navigationId: currentNavigation.id,
                            url: url,
                            tabId: currentNavigation.tabId,
                            rules: [],
                            numberOfRules: 0,
                            numberOfRulesThatHaveSomethingToDo: 0,
                            numberOfRulesThatHaveExecuted: 0
                        });
                    });
                });
            });
        });
    });

    describe('and the content script has executed', () => {

        beforeEach(() => {
            contentScriptFunction(navigationInterface, messageBus, documentMutationsProvider);
        });

        describe('and the rules are returned', () => {
            let notification;
            let existingRuleForUrl;
            let existingRuleSelector;

            beforeEach(async () => {
                existingRuleSelector = 'div';
                existingRuleForUrl = {
                    id: 1,
                    name: 'rule',
                    automatic: false,
                    actions: [
                        {
                            type: 'select',
                            selector: existingRuleSelector,
                            action: {
                                type: 'delete'
                            }
                        }
                    ]
                };
                const message = messageBus.channels['requestRulesForUrl'].target.expectMessage(m => true);
                const notificationPromise = messageBus.channels['notifyRulesForNavigation'].source.nextMessage();
                messageBus.channels['draftRuleForNavigationRequest'].source.onMessage((msg, sendResponse) => {
                    sendResponse({
                        name: 'draft',
                        actions: []
                    });
                });
                messageBus.channels['requestEditableStatus'].source.onMessage((msg, sendResponse) => {
                    sendResponse(true)
                });
                message.sendResponse([existingRuleForUrl]);
                notification = await notificationPromise;
            });

            it('should have emitted a notification', () => {
                expect(notification).toEqual({
                    navigationId: currentNavigation.id,
                    url: url,
                    tabId: currentNavigation.tabId,
                    rules: [
                        {
                            name: existingRuleForUrl.name,
                            id: existingRuleForUrl.id,
                            hasSomethingToDo: false,
                            hasExecuted: false
                        }
                    ],
                    numberOfRules: 1,
                    numberOfRulesThatHaveSomethingToDo: 0,
                    numberOfRulesThatHaveExecuted: 0
                })
            });

            describe('and then a dom mutation happens', () => {
                let newNotification;
                let removeSpy;
                let ruleStateForNavigationChangedNotification;

                beforeEach(async () => {
                    const element = document.createElement('div');
                    removeSpy = jest.spyOn(element, 'remove');
                    document.body.append(element);
                    messageBus.channels['requestEditableStatus'].source.onMessage((msg, sendResponse) => {
                        sendResponse(true)
                    });
                    const notificationPromise = messageBus.channels['notifyRulesForNavigation'].source.nextMessage();
                    const ruleStateForNavigationChangedNotificationPromise = messageBus.channels['ruleStateForNavigationChangeNotification'].source.nextMessage();
                    documentMutationOccurred.dispatch();
                    newNotification = await notificationPromise;
                    ruleStateForNavigationChangedNotification = await ruleStateForNavigationChangedNotificationPromise;
                });

                it('should have emitted a notification about how a rule has something to do', () => {
                    expect(ruleStateForNavigationChangedNotification).toEqual({
                        navigationId: currentNavigation.id,
                        state: {
                            editable: true,
                            effectsOnElement: [],
                            hasExecuted: false,
                            hasSomethingToDo: true,
                            id: existingRuleForUrl.id,
                            name: existingRuleForUrl.name
                        }
                    })
                });

                it('should have emitted a new notification', () => {
                    expect(newNotification).toEqual({
                        navigationId: currentNavigation.id,
                        url: url,
                        tabId: currentNavigation.tabId,
                        rules: [
                            {
                                name: existingRuleForUrl.name,
                                id: existingRuleForUrl.id,
                                hasSomethingToDo: true,
                                hasExecuted: false
                            }
                        ],
                        numberOfRules: 1,
                        numberOfRulesThatHaveSomethingToDo: 1,
                        numberOfRulesThatHaveExecuted: 0
                    })
                });

                describe('and then a request to execute the rule is sent', () => {

                    beforeEach(async () => {
                        await messageBus.channels['executeRule'].target.sendMessageAsync({
                            ruleId: existingRuleForUrl.id,
                            navigationId: currentNavigation.id
                        });
                    });

                    it('should have removed the element', () => {
                        expect(removeSpy).toHaveBeenCalled();
                    });

                    describe('and then a dom mutation is emitted', () => {
                        let newNotification;
    
                        beforeEach(async () => {
                            const notificationPromise = messageBus.channels['notifyRulesForNavigation'].source.nextMessage();
                            documentMutationOccurred.dispatch();
                            newNotification = await notificationPromise;
                        });
    
                        it('should have emitted a new notification', () => {
                            expect(newNotification).toEqual({
                                navigationId: currentNavigation.id,
                                url: url,
                                tabId: currentNavigation.tabId,
                                rules: [
                                    {
                                        name: existingRuleForUrl.name,
                                        id: existingRuleForUrl.id,
                                        hasSomethingToDo: false,
                                        hasExecuted: true
                                    }
                                ],
                                numberOfRules: 1,
                                numberOfRulesThatHaveSomethingToDo: 0,
                                numberOfRulesThatHaveExecuted: 1
                            });
                        });
                    });
                });
            });
        });
    });
});