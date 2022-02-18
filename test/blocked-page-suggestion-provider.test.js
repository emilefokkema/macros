import { SuggestionCollection } from '../src/content-script/suggestions/suggestion-collection';
import { BlockedPageSuggestionProvider } from '../src/content-script/suggestions/blocked-page-suggestion-provider';
import { FakeRuleCollection } from './fake-rule-collection';
import { FakeElementIndicator } from './fake-element-indicator';
import { FakeDocumentMutationsProvider } from './fake-document-mutations-provider';

describe('given a suggestion collection that has a blocked page suggestion provider', () => {
    let suggestionCollection;

    beforeEach(() => {
        const blockedPageSuggestionProvider = new BlockedPageSuggestionProvider();
        const ruleCollection = new FakeRuleCollection();
        const elementIndicator = new FakeElementIndicator();
        const documentMutationsProvider = new FakeDocumentMutationsProvider();
        suggestionCollection = new SuggestionCollection(
            ruleCollection,
            elementIndicator,
            documentMutationsProvider,
            [blockedPageSuggestionProvider]);

    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('and two elements that block the page', () => {
        const div1Id = 'div1Id';
        const div2Id = 'div2Id';

        beforeEach(() => {
            document.body.innerHTML = `
            <div id='${div1Id}' style='z-index:100;width: 100px;height: 100px;position:absolute;left:0;top:0'></div>
            <div id='${div2Id}' style='z-index:200;width: 100px;height: 100px;position:absolute;left:300;top:300'></div>`;
            const div1 = document.getElementById(div1Id);
            jest.spyOn(div1,'getBoundingClientRect').mockImplementation(() => ({x:0, y: 0, width:100,height:100}))
            const div2 = document.getElementById(div2Id);
            jest.spyOn(div2,'getBoundingClientRect').mockImplementation(() => ({x:300, y: 300, width:100,height:100}))
        });

        describe('and then suggestions are created', () => {
        
            beforeEach(() => {
                suggestionCollection.createSuggestions();
            });
    
            it('should have created suggestions to delete both elements', () => {
                expect(suggestionCollection.getSuggestions()).toEqual([
                    {
                        actionDefinition: {
                            action: {
                                type: 'delete'
                            },
                            selector: `div#${div1Id}[style]`,
                            type: 'select'
                        },
                        description: 'delete',
                        hasExecuted: false,
                        id: 0
                    },
                    {
                        actionDefinition: {
                            action: {
                                type: 'delete'
                            },
                            selector: `div#${div2Id}[style]`,
                            type: 'select'
                        },
                        description: 'delete',
                        hasExecuted: false,
                        id: 1
                    }
                ]);
            });
        });
    });

    describe('and two elements that block the page, but one blocks the other', () => {
        const div1Id = 'div1Id';
        const div2Id = 'div2Id';

        beforeEach(() => {
            document.body.innerHTML = `
            <div id='${div1Id}' style='z-index:100;width: 100px;height: 100px;position:absolute;left:0;top:0'></div>
            <div id='${div2Id}' style='z-index:200;width: 100px;height: 100px;position:absolute;left:20;top:20'></div>`;
            const div1 = document.getElementById(div1Id);
            jest.spyOn(div1,'getBoundingClientRect').mockImplementation(() => ({x:0, y: 0, width:100,height:100}))
            const div2 = document.getElementById(div2Id);
            jest.spyOn(div2,'getBoundingClientRect').mockImplementation(() => ({x:20, y: 20, width:100,height:100}))
        });

        describe('and then suggestions are created', () => {
        
            beforeEach(() => {
                suggestionCollection.createSuggestions();
            });
    
            it('should have created the suggestion to delete the element', () => {
                expect(suggestionCollection.getSuggestions()).toEqual([
                    {
                        actionDefinition: {
                            action: {
                                type: 'delete'
                            },
                            selector: `div#${div2Id}[style]`,
                            type: 'select'
                        },
                        description: 'delete',
                        hasExecuted: false,
                        id: 0
                    }
                ]);
            });
        });
    });

    describe('and an element that blocks the page', () => {
        let divId = 'someId';

        beforeEach(() => {
            document.body.innerHTML = `<div id='${divId}' style='z-index:100;width: 100px;height: 100px;position:absolute'></div>`;
            const div = document.getElementById(divId);
            jest.spyOn(div,'getBoundingClientRect').mockImplementation(() => ({x:0, y: 0, width:100,height:100}))
        });

        describe('and then suggestions are created', () => {
        
            beforeEach(() => {
                suggestionCollection.createSuggestions();
            });
    
            it('should have created the suggestion to delete the element', () => {
                expect(suggestionCollection.getSuggestions()).toEqual([
                    {
                        actionDefinition: {
                            action: {
                                type: 'delete'
                            },
                            selector: `div#${divId}[style]`,
                            type: 'select'
                        },
                        description: 'delete',
                        hasExecuted: false,
                        id: 0
                    }
                ]);
            });
        });
    });

    describe('and two elements that block the page, but one is parent of the other', () => {
        let childDivId = 'childId';
        let parentDivId = 'parentId';

        beforeEach(() => {
            document.body.innerHTML = `
            <div id='${parentDivId}' style='z-index:100;width: 100px;height: 100px;position:absolute'>
                <div id='${childDivId}' style='z-index:100;width: 100px;height: 100px;position:absolute'></div>
            </div>`;
            const parentDiv = document.getElementById(parentDivId);
            jest.spyOn(parentDiv,'getBoundingClientRect').mockImplementation(() => ({x:0, y: 0, width:100,height:100}))
            const childDiv = document.getElementById(childDivId);
            jest.spyOn(childDiv,'getBoundingClientRect').mockImplementation(() => ({x:0, y: 0, width:100,height:100}))
        });

        describe('and then suggestions are created', () => {
        
            beforeEach(() => {
                suggestionCollection.createSuggestions();
            });
    
            it('should have created the suggestion to delete the parent element', () => {
                expect(suggestionCollection.getSuggestions()).toEqual([
                    {
                        actionDefinition: {
                            action: {
                                type: 'delete'
                            },
                            selector: `div#${parentDivId}[style]`,
                            type: 'select'
                        },
                        description: 'delete',
                        hasExecuted: false,
                        id: 0
                    }
                ]);
            });
        });
    });

    describe('and an element that would have blocked the page if it had been visible', () => {
        const divId = 'someId';

        beforeEach(() => {
            document.body.innerHTML = `<div id='${divId}' style='z-index:100;width: 100px;height: 100px;position:absolute;display:none;'></div>`;
            const div = document.getElementById(divId);
            jest.spyOn(div,'getBoundingClientRect').mockImplementation(() => ({x:0, y: 0, width:100,height:100}))
        });

        describe('and then suggestions are created', () => {
        
            beforeEach(() => {
                suggestionCollection.createSuggestions();
            });
    
            it('should not have created any suggestions', () => {
                expect(suggestionCollection.getSuggestions()).toEqual([]);
            });
        });
    });

    describe('and an element that would have blocked the page if it had been non-relatively positioned', () => {
        const divId = 'someId';

        beforeEach(() => {
            document.body.innerHTML = `<div id='${divId}' style='z-index:100;width: 100px;height: 100px;position:relative'></div>`;
            const div = document.getElementById(divId);
            jest.spyOn(div,'getBoundingClientRect').mockImplementation(() => ({x:0, y: 0, width:100,height:100}))
        });

        describe('and then suggestions are created', () => {
        
            beforeEach(() => {
                suggestionCollection.createSuggestions();
            });
    
            it('should not have created any suggestions', () => {
                expect(suggestionCollection.getSuggestions()).toEqual([]);
            });
        });
    });

    describe('and an element that would have blocked the page if its visiblity had not been hidden', () => {
        const divId = 'someId';

        beforeEach(() => {
            document.body.innerHTML = `<div id='${divId}' style='z-index:100;width: 100px;height: 100px;visibility:hidden'></div>`;
            const div = document.getElementById(divId);
            jest.spyOn(div,'getBoundingClientRect').mockImplementation(() => ({x:0, y: 0, width:100,height:100}))
        });

        describe('and then suggestions are created', () => {
        
            beforeEach(() => {
                suggestionCollection.createSuggestions();
            });
    
            it('should not have created any suggestions', () => {
                expect(suggestionCollection.getSuggestions()).toEqual([]);
            });
        });
    });

    describe('and an element that would have blocked the page if its parent had not had opacity 0', () => {
        let divId = 'someId';

        beforeEach(() => {
            document.body.innerHTML = `
            <div style='opacity:0;'>
                <div id='${divId}' style='z-index:100;width: 100px;height: 100px;position:absolute'></div>
            </div>
            `;
            const div = document.getElementById(divId);
            jest.spyOn(div,'getBoundingClientRect').mockImplementation(() => ({x:0, y: 0, width:100,height:100}))
        });

        describe('and then suggestions are created', () => {
        
            beforeEach(() => {
                suggestionCollection.createSuggestions();
            });
    
            it('should not have created any suggestions', () => {
                expect(suggestionCollection.getSuggestions()).toEqual([]);
            });
        });
    });

    describe('and an element that would have blocked the page if it had had a z-index', () => {
        const divId = 'someId';

        beforeEach(() => {
            document.body.innerHTML = `<div id='${divId}' style='width: 100px;height: 100px;position:absolute;'></div>`;
            const div = document.getElementById(divId);
            jest.spyOn(div,'getBoundingClientRect').mockImplementation(() => ({x:0, y: 0, width:100,height:100}))
        });

        describe('and then suggestions are created', () => {
        
            beforeEach(() => {
                suggestionCollection.createSuggestions();
            });
    
            it('should not have created any suggestions', () => {
                expect(suggestionCollection.getSuggestions()).toEqual([]);
            });
        });
    });

    describe('and an element that would have blocked the page if it had been in the viewport', () => {
        let divId = 'someId';

        beforeEach(() => {
            document.body.innerHTML = `<div id='${divId}' style='z-index:100;width: 100px;height: 100px;position:absolute'></div>`;
            const div = document.getElementById(divId);
            jest.spyOn(div,'getBoundingClientRect').mockImplementation(() => ({x:-200, y: 0, width:100,height:100}))
        });

        describe('and then suggestions are created', () => {
        
            beforeEach(() => {
                suggestionCollection.createSuggestions();
            });
    
            it('should not have created any suggestions', () => {
                expect(suggestionCollection.getSuggestions()).toEqual([]);
            });
        });
    });

    describe('and an element that would have blocked the page had its width and height not both been 0', () => {
        let divId = 'someId';

        beforeEach(() => {
            document.body.innerHTML = `<div id='${divId}' style='z-index:100;width: 0;height: 0;position:absolute'></div>`;
            const div = document.getElementById(divId);
            jest.spyOn(div,'getBoundingClientRect').mockImplementation(() => ({x:0, y: 0, width:100,height:100}))
        });

        describe('and then suggestions are created', () => {
        
            beforeEach(() => {
                suggestionCollection.createSuggestions();
            });
    
            it('should not have created any suggestions', () => {
                expect(suggestionCollection.getSuggestions()).toEqual([]);
            });
        });
    });
});