const { backgroundScript } = require('../src/background/background-script-function');
const { FakeNavigationInterface } = require('./fake-navigation-interface');
const { FakeStorage } = require('./fake-storage');
const { FakeButtonInteraction } = require('./fake-button-interaction');
const { FakeInspectedWindow } = require('./fake-inspected-window');
const { FakeCrossBoundaryEventFactory } = require('./fake-cross-boundary-event-factory');

describe('when the background script function has been executed', () => {
    let navigationInterface;
    let setPopup;
    let storage;
    let buttonInteraction;
    let inspectedWindow;
    let crossBoundaryEventFactory;
    let existingRule;

    beforeEach(() => {
        existingRule = {
            id: 0,
            urlPattern: 'foo.bar.baz/*'
        };
        navigationInterface = new FakeNavigationInterface();
        setPopup = jest.fn();
        storage = new FakeStorage();
        storage.setItem('rules', [existingRule]);
        buttonInteraction = new FakeButtonInteraction();
        inspectedWindow = new FakeInspectedWindow();
        crossBoundaryEventFactory = new FakeCrossBoundaryEventFactory();
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