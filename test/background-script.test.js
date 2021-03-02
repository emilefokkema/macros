const { backgroundScript } = require('../src/background/background-script-function');
const { FakeNavigationInterface } = require('./fake-navigation-interface');
const { FakeStorage } = require('./fake-storage');
const { FakeButtonInteraction } = require('./fake-button-interaction');
const { FakeInspectedWindow } = require('./fake-inspected-window');
const { FakeCrossBoundaryEventFactory } = require('./fake-cross-boundary-event-factory');

describe('given storage, navigation etc.', () => {
    let navigationInterface;
    let setPopup;
    let storage;
    let buttonInteraction;
    let inspectedWindow;
    let crossBoundaryEventFactory;

    beforeEach(() => {
        navigationInterface = new FakeNavigationInterface();
        setPopup = jest.fn();
        storage = new FakeStorage();
        buttonInteraction = new FakeButtonInteraction();
        inspectedWindow = new FakeInspectedWindow();
        crossBoundaryEventFactory = new FakeCrossBoundaryEventFactory();
    });

    describe('and the storage contains one rule', () => {
        let existingRule;

        beforeEach(() => {
            existingRule = {
                id: 0,
                urlPattern: 'foo.bar.baz/*'
            };
            storage.setItem('rules', [existingRule]);
        });

        describe('and the storage contains one editor with a navigation', () => {
            let existingEditor;
            let existingEditorNavigationId;
            let editorNavigationExists;
    
            beforeEach(() => {
                editorNavigationExists = true;
                existingEditorNavigationId = 'aaabbb';
                function navigationExists(navigationId){
                    return navigationId === existingEditorNavigationId && editorNavigationExists;
                }
                navigationInterface.navigationExists = jest.fn().mockImplementation(async navigationId => navigationExists(navigationId));
                navigationInterface.getNavigation = jest.fn().mockImplementation(async navigationId => {
                    if(!navigationExists(navigationId)){
                        return null;
                    }
                    return {};
                })
                existingEditor = {
                    ruleId: 0,
                    ownNavigationId: existingEditorNavigationId
                };
                storage.setItem('editors', [existingEditor]);
            });

            describe('that does not exists anymore', () => {

                beforeEach(() => {
                    editorNavigationExists = false;
                });

                describe('and the background script has executed', () => {

                    beforeEach(() => {
                        backgroundScript(setPopup, storage, buttonInteraction, navigationInterface, crossBoundaryEventFactory, inspectedWindow);
                    });

                    it('should return an edited status for the existing editor and its rule', async () => {
                        const editedStatus = await crossBoundaryEventFactory.events['requestEditedStatus'].target.sendMessageAsync({ruleId: existingRule.id});
                        expect(editedStatus).toEqual({
                            edited: false
                        })
                    });

                    describe('and the navigation disappeared event is fired', () => {
                        let editedStatusChangedEvent;

                        beforeEach(async () => {
                            const editedStatusChangedPromise = crossBoundaryEventFactory.events['editedStatusChanged'].source.nextMessage();
                            navigationInterface.navigationHasDisappeared.dispatch();
                            editedStatusChangedEvent = await editedStatusChangedPromise;
                        });

                        it('should have sent a message', () => {
                            expect(editedStatusChangedEvent).toEqual({
                                ruleId: existingRule.id,
                                edited: false
                            });
                        });

                        it('should have updated the list of editors in the storage', () => {
                            expect(storage.getItem('editors')).toEqual([]);
                        });
                    });
                });
            });

            describe('and the background script has executed', () => {

                beforeEach(() => {
                    backgroundScript(setPopup, storage, buttonInteraction, navigationInterface, crossBoundaryEventFactory, inspectedWindow);
                });

                it('should return an edited status for the existing editor and its rule', async () => {
                    const editedStatus = await crossBoundaryEventFactory.events['requestEditedStatus'].target.sendMessageAsync({ruleId: existingRule.id});
                    expect(editedStatus).toEqual({
                        edited: true
                    })
                });
            });
        });

        describe('and the background script has executed', () => {

            beforeEach(() => {
                backgroundScript(setPopup, storage, buttonInteraction, navigationInterface, crossBoundaryEventFactory, inspectedWindow);
            });

            it('the popup should have been set', () => {
                expect(setPopup.mock.calls[0]).toEqual(['popup.html']);
            });
        
            it('should be managing the subscriptions of the cross boundary event factory', () => {
                expect(crossBoundaryEventFactory.isManaging).toBe(true);
            });

            describe('and then a rule is requested by its id', () => {
                let rule;
        
                beforeEach(async () => {
                    rule = await crossBoundaryEventFactory.events['requestRuleById'].target.sendMessageAsync(existingRule.id);
                });
        
                it('it should have been returned', () => {
                    expect(rule).toEqual(existingRule);
                });
            });
        
            describe('and then a new rule is saved', () => {
                let newRuleId;
                let newUrlPattern;
                let ruleAddedNotificationPromise;
        
                beforeEach(async () => {
                    newUrlPattern = 'a.b.c*';
                    ruleAddedNotificationPromise = crossBoundaryEventFactory.events['notifyRuleAdded'].source.nextMessage();
                    newRuleId = await crossBoundaryEventFactory.events['requestSaveRule'].target.sendMessageAsync({urlPattern: newUrlPattern});
                });
        
                it('should have notified of an added rule', async () => {
                    await ruleAddedNotificationPromise;
                });
        
                it('a new id should have been returned', () => {
                    expect(newRuleId).toBe(1);
                });
        
                it('should have updated the storage', () => {
                    expect(storage.getItem('rules')).toEqual([
                        existingRule,
                        {
                            id: 1,
                            urlPattern: newUrlPattern
                        }
                    ]);
                });
            });
        });
    });
});