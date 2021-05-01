import { contentScriptFunction } from '../src/content-script/content-script-function';
import { FakeNavigationInterface } from './fake-navigation-interface';
import { FakeMessageBus } from './fake-message-bus';
import { Event } from '../src/shared/events';

class Element{
    constructor(attributeNames, selector){
        this.removed = new Event();
        this.parentNode = {
            removeChild: () => this.removed.dispatch()
        };
        this.attributeNames = attributeNames || [];
        this.selector = selector;
        this.localName = 'element';
    }
    getAttributeNames(){
        return this.attributeNames;
    }
    matches(selector){
        return this.selector === selector;
    }
}

class ElementList{
    constructor(){
        this.elements = [];
        this.elementRemoved = new Event();
    }
    getElements(){
        return this.elements.slice();
    }
    removeElement(el){
        var index = this.elements.indexOf(el);
        if(index === -1){
            return;
        }
        this.elements.splice(index, 1);
        this.elementRemoved.dispatch();
    }
    addElement(){
        var el = new Element();
        el.removed.listen(() => this.removeElement(el))
        this.elements.push(el);
    }
}

describe('given navigation, etc', () => {
    let navigationInterface;
    let messageBus;
    let currentNavigation;
    let url;
    let querySelectorAllResults;
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
        querySelectorAllResults = {};
        jest.spyOn(global, 'location', 'get').mockImplementation(() => {
            return {
                href: url
            };
        });
        jest.spyOn(global.document, 'querySelectorAll').mockImplementation((selector) => querySelectorAllResults[selector].getElements());
        currentNavigation = {
            id: 'nav0',
            historyId: 'history0',
            tabId: 3
        };
        navigationInterface = new FakeNavigationInterface();
        jest.spyOn(navigationInterface, 'getCurrent').mockImplementation(async () => currentNavigation);
        messageBus = new FakeMessageBus();
    });

    describe('and there is an element for a selector', () => {
        let selector;
        let elementsForSelector;

        beforeEach(() => {
            selector = 'div';
            elementsForSelector = new ElementList();
            elementsForSelector.addElement();
            querySelectorAllResults[selector] = elementsForSelector;
        })

        describe('and the content script has executed', () => {
            let elementSelectedInDevtools;

            beforeEach(() => {
                const result = contentScriptFunction(navigationInterface, messageBus, documentMutationsProvider);
                elementSelectedInDevtools = result.elementSelectedInDevtools;
            });

            describe('and an automatically deleting rule is returned', () => {
                let existingRuleForUrl;

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
                    const whenRemoved = elementsForSelector.elementRemoved.next();
                    message.sendResponse([existingRuleForUrl]);
                    await whenRemoved;
                });

                it('should have removed the element', () => {
                    expect(elementsForSelector.getElements().length).toBe(0);
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
                            numberOfRulesThatHaveExecuted: 1,
                            selectedElement: null
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
                                numberOfRulesThatHaveExecuted: 0,
                                selectedElement: null
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
                        numberOfRulesThatHaveExecuted: 0,
                        selectedElement: null
                    })
                });

                describe('and then the rule is updated', () => {
                    let newNotification;

                    beforeEach(async () => {
                        const otherSelector = 'a';
                        querySelectorAllResults[otherSelector] = new ElementList();
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
                            numberOfRulesThatHaveExecuted: 0,
                            selectedElement: null
                        });
                    });
                });

                describe('and then a matching element is selected in devtools', () => {
                    let notification;
    
                    beforeEach(async () => {
                        const notificationPromise = messageBus.channels['notifyRulesForNavigation'].source.nextMessage();
                        elementSelectedInDevtools(new Element([], selector));
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
                            numberOfRulesThatHaveExecuted: 0,
                            selectedElement: {
                                effect: [
                                    {
                                        ruleId: existingRuleForUrl.id,
                                        effect: ['will delete this element']
                                    }
                                ],
                                selector: {
                                    attributeNames: [],
                                    classes: [],
                                    nodeName: 'element',
                                    text: 'element'
                                }
                            }
                        })
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
                        expect(elementsForSelector.getElements().length).toBe(0);
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
                            querySelectorAllResults[addedRuleSelector] = new ElementList();
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
                                numberOfRulesThatHaveExecuted: 0,
                                selectedElement: null
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
                                numberOfRulesThatHaveExecuted: 0,
                                selectedElement: null
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
                            numberOfRulesThatHaveExecuted: 0,
                            selectedElement: null
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
            let elementsForSelector;

            beforeEach(async () => {
                elementsForSelector = new ElementList();
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
                querySelectorAllResults[existingRuleSelector] = elementsForSelector;
                const message = messageBus.channels['requestRulesForUrl'].target.expectMessage(m => true);
                const notificationPromise = messageBus.channels['notifyRulesForNavigation'].source.nextMessage();
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
                    numberOfRulesThatHaveExecuted: 0,
                    selectedElement: null
                })
            });

            it('should respond to a request to emit a notification', async () => {
                const notificationPromise = messageBus.channels['notifyRulesForNavigation'].source.nextMessage();
                messageBus.channels['emitRulesRequest'].target.sendMessage({tabId: currentNavigation.tabId});
                const notification = await notificationPromise;
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
                    numberOfRulesThatHaveExecuted: 0,
                    selectedElement: null
                })
            });

            describe('and then a dom mutation happens', () => {
                let newNotification;

                beforeEach(async () => {
                    elementsForSelector.addElement();
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
                                hasSomethingToDo: true,
                                hasExecuted: false
                            }
                        ],
                        numberOfRules: 1,
                        numberOfRulesThatHaveSomethingToDo: 1,
                        numberOfRulesThatHaveExecuted: 0,
                        selectedElement: null
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
                        expect(elementsForSelector.getElements().length).toBe(0);
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
                                numberOfRulesThatHaveExecuted: 1,
                                selectedElement: null
                            });
                        });
                    });
                });
            });
        });
    });
});