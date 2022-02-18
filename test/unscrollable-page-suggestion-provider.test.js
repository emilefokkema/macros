import { SuggestionCollection } from '../src/content-script/suggestions/suggestion-collection';
import { UnscrollablePageSuggestionProvider } from '../src/content-script/suggestions/unscrollable-page-suggestion-provider';
import { FakeRuleCollection } from './fake-rule-collection';
import { FakeElementIndicator } from './fake-element-indicator';
import { FakeDocumentMutationsProvider } from './fake-document-mutations-provider';
import { FakeClassRepository } from './fake-class-repository';


describe('given a suggestion collection that has an unscrollable page suggestion provider', () => {
    let suggestionCollection;
    let classRepository;

    beforeEach(() => {
        classRepository = new FakeClassRepository();
        const unscrollablePageSuggestionProvider = new UnscrollablePageSuggestionProvider(classRepository);
        const ruleCollection = new FakeRuleCollection();
        const elementIndicator = new FakeElementIndicator();
        const documentMutationsProvider = new FakeDocumentMutationsProvider();
        suggestionCollection = new SuggestionCollection(
            ruleCollection,
            elementIndicator,
            documentMutationsProvider,
            [unscrollablePageSuggestionProvider]);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('and an element that exceeds the viewport and a parent element that has overflow hidden', () => {
        const parentId = 'parentDiv';
        const childId = 'childDiv';

        beforeEach(() => {
            document.body.innerHTML = `
                <div id='${parentId}' style='overflow-y:hidden;'>
                    <div id='${childId}'></div>
                </div>`
            const child = document.getElementById(childId);
            jest.spyOn(child,'getBoundingClientRect').mockImplementation(() => ({x:0, y: 0, width:innerWidth,height:innerHeight + 500}));
        });

        describe('and then suggestions are created', () => {

            beforeEach(() => {
                suggestionCollection.createSuggestions();
            });

            it('should have created one suggestion', () => {
                expect(suggestionCollection.getSuggestions()).toEqual([
                    {
                        actionDefinition: {
                            action: {
                                type: 'removeStyleProperty',
                                property: 'overflow-y'
                            },
                            selector: `div#${parentId}[style]`,
                            type: 'select'
                        },
                        description: 'show overflow',
                        hasExecuted: false,
                        id: 0
                    }
                ]);
            });
        });
    });

    describe('and an element that exceeds the viewport and a parent element that has overflow hidden because of a class', () => {
        const parentId = 'parentDiv';
        const childId = 'childDiv';
        const className = 'some-class'
        let styleElement;
        let getClassesThatLeadToPropertiesSpy;

        beforeEach(() => {
            styleElement = document.createElement('style');
            styleElement.textContent = `.${className}{overflow-y: hidden;}`;
            document.head.appendChild(styleElement);
            document.body.innerHTML = `
            <div id='${parentId}' class='${className}'>
                <div id='${childId}'></div>
            </div>`
            const child = document.getElementById(childId);
            jest.spyOn(child,'getBoundingClientRect').mockImplementation(() => ({x:0, y: 0, width:innerWidth,height:innerHeight + 500}));
            getClassesThatLeadToPropertiesSpy = jest.spyOn(classRepository, 'getClassesThatLeadToPropertiesOnElement').mockImplementation((element, propertyNames) => {
                return [className];
            });
        });

        afterEach(() => {
            styleElement.remove();
            getClassesThatLeadToPropertiesSpy.mockReset();
        });

        describe('and then suggestions are created', () => {

            beforeEach(() => {
                suggestionCollection.createSuggestions();
            });

            it('should have created one suggestion', () => {
                expect(suggestionCollection.getSuggestions()).toEqual([
                    {
                        actionDefinition: {
                            action: {
                                type: 'removeClass',
                                class: className
                            },
                            selector: `.${className}`,
                            type: 'select'
                        },
                        description: 'show overflow',
                        hasExecuted: false,
                        id: 0
                    }
                ]);
            });
        });
    });
});