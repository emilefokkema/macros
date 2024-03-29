import { backgroundScript } from '../src/background/background-script-function';
import { FakeNavigationInterface } from './fake-navigation-interface';
import { FakeStorage } from './fake-storage';
import { FakeButtonInteraction } from './fake-button-interaction';
import { FakeMessageBus } from './fake-message-bus';
import { whenReturns } from './when-returns';

describe('given storage, navigation etc.', () => {
    let navigationInterface;
    let setPopup;
    let storage;
    let buttonInteraction;
    let messageBus;

    beforeEach(() => {
        navigationInterface = new FakeNavigationInterface();
        setPopup = jest.fn();
        storage = new FakeStorage();
        buttonInteraction = new FakeButtonInteraction();
        messageBus = new FakeMessageBus();
    });

    describe('and the storage contains rules', () => {
        let existingRule1;
        let existingRule2;

        beforeEach(() => {
            existingRule1 = {
                id: 1,
                urlPattern: 'foo.bar.baz/*'
            };
            existingRule2 = {
                id: 2,
                urlPattern: 'www.google.com'
            };
            storage.setItem('rules', [existingRule1, existingRule2]);
        });

        describe('and a navigation exists', () => {
            let existingNavigationId;
            let existingNavigation;
            let navigationExists;
            let tabId;

            beforeEach(() => {
                tabId = 4;
                navigationExists = true;
                existingNavigationId = 'aaabbb';
                existingNavigation = {
                    id: existingNavigationId,
                    tabId: tabId,
                    focus(){}
                };
                function givenNavigationExists(navigationId){
                    return navigationId === existingNavigationId && navigationExists;
                }
                navigationInterface.navigationExists = jest.fn().mockImplementation(async navigationId => givenNavigationExists(navigationId));
                navigationInterface.getNavigation = jest.fn().mockImplementation(async navigationId => {
                    if(!givenNavigationExists(navigationId)){
                        return null;
                    }
                    return existingNavigation;
                });
            });

            describe('and the storage contains a button notification for the navigation', () => {

                beforeEach(() => {
                    storage.setItem('buttons', [
                        {
                            tabId: tabId,
                            notifications: [
                                {
                                    navigationId: existingNavigationId,
                                    numberOfRules: 1,
                                    numberOfRulesThatHaveSomethingToDo: 1,
                                    numberOfRulesThatHaveExecuted: 0
                                }
                            ]
                        }
                    ]);
                });

                describe('and the navigation does not exist anymore', () => {

                    beforeEach(() => {
                        navigationExists = false;
                    });

                    describe('and the background script has executed', () => {

                        beforeEach(() => {
                            backgroundScript(setPopup, storage, buttonInteraction, navigationInterface, messageBus);
                        });

                        describe('and the navigation disappeared event is fired', () => {
                            let whenSaved;

                            beforeEach(async () => {
                                whenSaved = whenReturns(storage, 'setItem', args => args[0] === 'buttons');
                                navigationInterface.navigationHasDisappeared.dispatch();
                                await whenSaved;
                            });

                            it('should have deleted buttons from storage', () => {
                                expect(storage.items['buttons']).toEqual([]);
                            });
                        });
                    });
                });

                describe('and the background script has executed', () => {

                    beforeEach(() => {
                        backgroundScript(setPopup, storage, buttonInteraction, navigationInterface, messageBus);
                    });

                    describe('and another notification arrives for the same navigation, but with zero rules', () => {
                        let setBadgeTextArgs;

                        beforeEach(async () => {
                            const whenBadgeTextSetToEmpty = whenReturns(buttonInteraction, 'setBadgeText', args => args[0].text === ``);
                            const whenZeroButtonsSaved = whenReturns(storage, 'setItem', args => args[0] === 'buttons' && args[1].length === 0)
                            messageBus.channels['notifyRulesForNavigation'].target.sendMessage({
                                navigationId: existingNavigationId,
                                numberOfRules: 0,
                                numberOfRulesThatHaveSomethingToDo: 0,
                                numberOfRulesThatHaveExecuted: 0,
                            });
                            setBadgeTextArgs = (await whenBadgeTextSetToEmpty).args;
                            await whenZeroButtonsSaved;
                        });

                        it(`should have set the button badge text to empty for the navigation's tab`, () => {
                            expect(setBadgeTextArgs).toEqual([{tabId, text:``}]);
                        });

                        it('should have removed the button from the storage', () => {
                            expect(storage.items['buttons']).toEqual([]);
                        });
                    });

                    describe('and another notification arrives for the same navigation', () => {
                        let setBadgeTextArgs;

                        beforeEach(async () => {
                            const whenBadgeTextSetTwice = whenReturns(buttonInteraction, 'setBadgeText', () => true, 2);
                            const whenButtonsSavedTwice = whenReturns(storage, 'setItem', () => true, 2);
                            messageBus.channels['notifyRulesForNavigation'].target.sendMessage({
                                navigationId: existingNavigationId,
                                numberOfRules: 2,
                                numberOfRulesThatHaveSomethingToDo: 0,
                                numberOfRulesThatHaveExecuted: 0,
                            });
                            setBadgeTextArgs = (await whenBadgeTextSetTwice).args;
                            await whenButtonsSavedTwice;
                        });

                        it(`should have set the button badge text for the navigation's tab`, () => {
                            expect(setBadgeTextArgs).toEqual([{tabId, text:`2`}]);
                        });

                        it('should have updated the button in the storage', () => {
                            expect(storage.items['buttons']).toEqual([
                                {
                                    tabId: tabId,
                                    notifications: [
                                        {
                                            navigationId: existingNavigationId,
                                            numberOfRules: 2,
                                            numberOfRulesThatHaveSomethingToDo: 0,
                                            numberOfRulesThatHaveExecuted: 0
                                        }
                                    ]
                                }
                            ]);
                        });
                    });
                });
            });

            describe('and the storage contains one editor with a navigation', () => {
                let existingEditor;
        
                beforeEach(() => {
                    existingEditor = {
                        ruleId: existingRule1.id,
                        ownNavigationId: existingNavigationId
                    };
                    storage.setItem('editors', [existingEditor]);
                });
    
                describe('that does not exists anymore', () => {
    
                    beforeEach(() => {
                        navigationExists = false;
                    });
    
                    describe('and the background script has executed', () => {
    
                        beforeEach(() => {
                            backgroundScript(setPopup, storage, buttonInteraction, navigationInterface, messageBus);
                        });
    
                        it('should return an edited status for the existing editor and its rule', async () => {
                            const editedStatus = await messageBus.channels['requestEditedStatus'].target.sendMessageAsync({ruleId: existingRule1.id});
                            expect(editedStatus).toEqual({
                                edited: false
                            })
                        });
    
                        describe('and the navigation disappeared event is fired', () => {
                            let editedStatusChangedEvent;
    
                            beforeEach(async () => {
                                const editedStatusChangedPromise = messageBus.channels['editedStatusChanged'].source.nextMessage();
                                navigationInterface.navigationHasDisappeared.dispatch();
                                editedStatusChangedEvent = await editedStatusChangedPromise;
                            });
    
                            it('should have sent a message', () => {
                                expect(editedStatusChangedEvent).toEqual({
                                    ruleId: existingRule1.id,
                                    edited: false
                                });
                            });
    
                            it('should have updated the list of editors in the storage', () => {
                                expect(storage.items['editors']).toEqual([]);
                            });
                        });
                    });
                });
    
                describe('and the background script has executed', () => {
    
                    beforeEach(() => {
                        backgroundScript(setPopup, storage, buttonInteraction, navigationInterface, messageBus);
                    });
    
                    it('should return an edited status for the existing editor and its rule', async () => {
                        const editedStatus = await messageBus.channels['requestEditedStatus'].target.sendMessageAsync({ruleId: existingRule1.id});
                        expect(editedStatus).toEqual({
                            edited: true
                        })
                    });
    
                    describe('when opening an editor for the rule is requested', () => {
                        let focusSpy;
    
                        beforeEach(async () => {
                            focusSpy = jest.spyOn(existingNavigation, 'focus');
                            await messageBus.channels['openEditor'].target.sendMessageAsync({ruleId: existingRule1.id});
                        });
    
                        it('should have focussed the editor\'s navigation', () => {
                            expect(focusSpy).toHaveBeenCalled();
                        });

                        describe('and then the navigation doesn\'t exist anymore', () => {
                            let notification;

                            beforeEach(async () => {
                                navigationExists = false;
                                const whenSaved = whenReturns(storage, 'setItem', args => args[0] === 'editors');
                                const notificationPromise = messageBus.channels['editedStatusChanged'].source.nextMessage();
                                navigationInterface.navigationHasDisappeared.dispatch();
                                await whenSaved;
                                notification = await notificationPromise;
                            });

                            it('should have deleted the editor from storage', () => {
                                expect(storage.items['editors']).toEqual([]);
                            });

                            it('should have emitted a notification that the rule is no longer being edited', () => {
                                expect(notification).toEqual({
                                    ruleId: existingRule1.id,
                                    edited: false
                                });
                            });
                        });
                    });
                });
            });

            describe('and the background script has executed', () => {

                beforeEach(() => {
                    backgroundScript(setPopup, storage, buttonInteraction, navigationInterface, messageBus);
                });

                describe('and a notification for the existing navigation is sent', () => {
                    let badgeTextSetArgs;

                    beforeEach(async () => {
                        const whenButtonSaved = whenReturns(storage, 'setItem', args => args[0] === 'buttons' && args[1].length > 0)
                        const whenBadgeTextSet = whenReturns(buttonInteraction, 'setBadgeText');
                        messageBus.channels['notifyRulesForNavigation'].target.sendMessage({
                            navigationId: existingNavigationId,
                            numberOfRules: 1,
                            numberOfRulesThatHaveSomethingToDo: 1,
                            numberOfRulesThatHaveExecuted: 0,
                        });
                        await whenButtonSaved;
                        badgeTextSetArgs = (await whenBadgeTextSet).args;
                    });

                    it('should have set the badge text', () => {
                        expect(badgeTextSetArgs).toEqual([{tabId, text: '1'}]);
                    });

                    it('should have saved the notification', () => {
                        expect(storage.items['buttons']).toEqual([
                            {
                                tabId: tabId,
                                notifications: [
                                    {
                                        navigationId: existingNavigationId,
                                        numberOfRules: 1,
                                        numberOfRulesThatHaveSomethingToDo: 1,
                                        numberOfRulesThatHaveExecuted: 0
                                    }
                                ]
                            }
                        ])
                    });
                });
            });
        });

        describe('and the background script has executed', () => {

            beforeEach(() => {
                backgroundScript(setPopup, storage, buttonInteraction, navigationInterface, messageBus);
            });

            it('the popup should have been set', () => {
                expect(setPopup.mock.calls[0]).toEqual(['sandbox.html?page=popup.html']);
            });

            it('should return the rule', async () => {
                const rules = await messageBus.channels['requestRulesForUrl'].target.sendMessageAsync('foo.bar.baz/a');
                expect(rules).toEqual([existingRule1]);
            });

            it('should return all rules', async () => {
                const rules = await messageBus.channels['requestAllRules'].target.sendMessageAsync();
                expect(rules).toEqual([existingRule1, existingRule2]);
            });

            it('should delete a rule', async () => {
                const ruleDeletedMessagePromise = messageBus.channels['notifyRuleDeleted'].source.nextMessage();
                await messageBus.channels['requestDeleteRule'].target.sendMessageAsync(existingRule1.id);
                const ruleDeletedMessage = await ruleDeletedMessagePromise;
                expect(storage.items['rules']).toEqual([existingRule2]);
                expect(ruleDeletedMessage).toEqual({ruleId: existingRule1.id});
            });

            describe('and then an editor is requested', () => {
                let spy;
                let openEditorPromise;

                beforeEach(() => {
                    spy = jest.spyOn(navigationInterface, 'openTab');
                    openEditorPromise = messageBus.channels['openEditor'].target.sendMessageAsync({ruleId: existingRule1.id});
                });

                it('should have opened a tab with the right url', () => {
                    expect(spy).toHaveBeenCalledWith(`sandbox.html?page=create-rule.html%3FruleId%3D${existingRule1.id}`);
                });

                describe('and then the editor is loaded', () => {
                    let editorNavigation;
                    let editorNavigationId;

                    beforeEach(() => {
                        editorNavigationId = 'navId';
                        editorNavigation = {id: editorNavigationId};
                        messageBus.channels['editorLoaded'].target.sendMessage({ruleId: existingRule1.id}, editorNavigation);
                    });

                    it('the promise from opening the editor should have resolved', async () => {
                        await openEditorPromise;
                        expect(true).toBe(true);
                    });

                    it('should have saved the new editor', () => {
                        expect(storage.items['editors']).toEqual([
                            {
                                ruleId: existingRule1.id,
                                ownNavigationId: editorNavigationId,
                                otherNavigationId: undefined
                            }
                        ]);
                    });
                });
            });

            describe('and then a rule is requested by its id', () => {
                let rule;
        
                beforeEach(async () => {
                    rule = await messageBus.channels['requestRuleById'].target.sendMessageAsync(existingRule1.id);
                });
        
                it('it should have been returned', () => {
                    expect(rule).toEqual(existingRule1);
                });
            });
        
            describe('and then a new rule is saved', () => {
                let newRuleId;
                let newUrlPattern;
                let ruleAddedNotificationPromise;
        
                beforeEach(async () => {
                    newUrlPattern = 'a.b.c*';
                    ruleAddedNotificationPromise = messageBus.channels['notifyRuleAdded'].source.nextMessage();
                    newRuleId = await messageBus.channels['requestSaveRule'].target.sendMessageAsync({urlPattern: newUrlPattern});
                });
        
                it('should have notified of an added rule', async () => {
                    await ruleAddedNotificationPromise;
                });
        
                it('a new id should have been returned', () => {
                    expect(newRuleId).toBe(3);
                });
        
                it('should have updated the storage', () => {
                    expect(storage.items['rules']).toEqual([
                        existingRule1,
                        existingRule2,
                        {
                            id: 3,
                            urlPattern: newUrlPattern
                        }
                    ]);
                });
            });

            describe('and then a rule is updated', () => {
                let newRuleId;
                let newUrlPattern;
                let ruleUpdatedNotification;

                beforeEach(async () => {
                    newUrlPattern = 'a.b.c*';
                    const ruleUpdatedNotificationPromise = messageBus.channels['notifyRuleUpdated'].source.nextMessage();
                    newRuleId = await messageBus.channels['requestSaveRule'].target.sendMessageAsync({id: existingRule1.id, urlPattern: newUrlPattern});
                    ruleUpdatedNotification = await ruleUpdatedNotificationPromise;
                });

                it(`the updated rule's id should have been returned`, () => {
                    expect(newRuleId).toBe(existingRule1.id);
                });

                it('should have sent a notification that a rule has been updated', () => {
                    expect(ruleUpdatedNotification).toEqual({ruleId: existingRule1.id})
                });

                it('should have updated the storage', () => {
                    expect(storage.items['rules']).toEqual([
                        existingRule2,
                        {
                            id: existingRule1.id,
                            urlPattern: newUrlPattern
                        }
                    ]);
                });
            });
        });
    });

    describe('and the background script has executed', () => {

        beforeEach(() => {
            backgroundScript(setPopup, storage, buttonInteraction, navigationInterface, messageBus);
        });

        describe('and then a new rule is saved', () => {
            let notification;
            let newRuleId;
            let urlPattern;

            beforeEach(async () => {
                urlPattern = 'http://a.b/c'
                const notificationPromise = messageBus.channels['notifyRuleAdded'].source.nextMessage();
                newRuleId = await messageBus.channels['requestSaveRule'].target.sendMessageAsync({urlPattern});
                notification = await notificationPromise;
            });

            it('should have returned the new rule id', () => {
                expect(newRuleId).toEqual(1);
            });

            it('should have saved the new rule', () => {
                expect(storage.items['rules']).toEqual([
                    {
                        urlPattern,
                        id: 1
                    }
                ]);
            });
        });
    });
});