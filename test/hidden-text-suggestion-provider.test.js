import { SuggestionCollection } from '../src/content-script/suggestions/suggestion-collection';
import { HiddenTextSuggestionProvider } from '../src/content-script/suggestions/hidden-text-suggestion-provider';
import { FakeRuleCollection } from './fake-rule-collection';
import { FakeElementIndicator } from './fake-element-indicator';
import { FakeDocumentMutationsProvider } from './fake-document-mutations-provider';
import { FakeClassRepository } from './fake-class-repository';

describe('given a suggestion collection that has a hidden text suggestion provider', () => {
    let suggestionCollection;
    let classRepository;

    beforeEach(() => {
        classRepository = new FakeClassRepository();
        const hiddenTextSuggestionProvider = new HiddenTextSuggestionProvider(classRepository);
        const ruleCollection = new FakeRuleCollection();
        const elementIndicator = new FakeElementIndicator();
        const documentMutationsProvider = new FakeDocumentMutationsProvider();
        suggestionCollection = new SuggestionCollection(
            ruleCollection,
            elementIndicator,
            documentMutationsProvider,
            [hiddenTextSuggestionProvider]);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('and an element that contains text and that is hidden', () => {
        const parentId = 'someId';

        beforeEach(() => {
            document.body.innerHTML = `
                <div id='${parentId}' style='display: none;'>
                    <div>
                        <em>And</em> then this is some text that also contains <a href='http://foo.bar'>links</a> and some other <span>things</span> as well. And
                        this is another sentence.
                    </div>
                </div>`
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
                                property: 'display'
                            },
                            selector: `div#${parentId}[style]`,
                            type: 'select'
                        },
                        description: 'display text',
                        hasExecuted: false,
                        id: 0
                    }
                ]);
            });
        });
    });
});