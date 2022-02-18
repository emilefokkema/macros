import { FakeInspectedWindow } from './fake-inspected-window';
import { Event } from '../src/shared/events';
import { FakeNavigationInterface } from './fake-navigation-interface';
import { FakeMessageBus } from './fake-message-bus';
import { devtoolsFunction } from '../src/devtools/devtools-function';
import { whenReturns } from './when-returns';

describe('given the dependencies', () => {
    let inspectedWindow;
    let createSidebarPaneInElements;
    let elementSelectionChanged;
    let navigationInterface;
    let messageBus;
    let tabId;

    beforeEach(() => {
        tabId = 1;
        inspectedWindow = new FakeInspectedWindow(tabId);
        createSidebarPaneInElements = jest.fn();
        elementSelectionChanged = new Event();
        navigationInterface = new FakeNavigationInterface();
        jest.spyOn(navigationInterface, 'getNavigationsForTabId').mockImplementation(() => Promise.resolve([
            {
                top: true,
                frameId: 0,
                url: 'http://a.b/c',
                name: 'a'
            },
            {
                top: false,
                frameId: 1,
                url: 'http://c.d/e',
                name: 'b'
            }
        ]))
        messageBus = new FakeMessageBus();
    });

    describe('and the devtools function is executed', () => {

        beforeEach(() => {
            devtoolsFunction(inspectedWindow, createSidebarPaneInElements, elementSelectionChanged, navigationInterface, messageBus);
        });

        it('should have created a sidebar pane in elements', () => {
            expect(createSidebarPaneInElements).toHaveBeenCalledWith('Macros', 'sandbox.html?page=devtools_sidebar.html%3FtabId%3D1');
        });

        describe('and the element selection changes', () => {
            let evalSpy;

            beforeEach(async () => {
                evalSpy = spyOn(inspectedWindow, 'eval');
                elementSelectionChanged.dispatch();
                await new Promise((res) => setTimeout(res, 2));
            });

            it('should have called eval on the inspected window', () => {
                expect(evalSpy).toHaveBeenCalledTimes(2);
                expect(evalSpy).toHaveBeenCalledWith('contentScript.onElementSelectedInDevtools($0)', {useContentScriptContext: true});
                expect(evalSpy).toHaveBeenCalledWith('contentScript.onElementSelectedInDevtools($0)', {useContentScriptContext: true, frameURL: 'http://c.d/e'});
            });
        });
    });
});