const { Extension } = require('./interaction/extension');
const { TestPagesClient } = require('./test-pages/client');

describe('when we go to a page for which there are suggestions', () => {
    let browser;
    let extension;
    let annoyingPopupPage;

    beforeAll(async () => {
        const testPagesClient = new TestPagesClient();
        const {browser: _browser, extension: _extension} = await Extension.loadInBrowser();
        browser = _browser;
        extension = _extension;
        annoyingPopupPage = await testPagesClient.goToAnnoyingPopup((await browser.pages())[0]);
        await annoyingPopupPage.whenPopupIsVisible();
    });

    afterAll(async () => {
        await browser.close();
    });

    describe('and we open the popup', () => {
        let popup;
        let ruleList;
        let suggestionToDelete;
        let suggestionList;

        beforeAll(async () => {
            popup = await extension.openPopupForPage(annoyingPopupPage.url);
            ([ruleList, suggestionList] = await Promise.all([popup.waitForRuleList(), popup.waitForSuggestionList()]))
            await Promise.all([ruleList.whenNotLoading(), suggestionList.waitForFirstSuggestion()])
            suggestionToDelete = (await suggestionList.getSuggestionsByDescription('delete'))[0];
        });

        it('there should not be a draft rule', async () => {
            expect(await ruleList.getDraftRule()).toBeFalsy();
        });

        it('there should not be any rules', async () => {
            expect((await ruleList.getRules()).length).toBe(0);
        });

        it('there should be a suggestion to delete something', () => {
            expect(suggestionToDelete).toBeTruthy();
        });

        describe('and we drag the suggestion to delete over the message that there are no rules', () => {
            let dragData;

            beforeAll(async () => {
                dragData = await suggestionToDelete.beginDragging();
                await ruleList.dragOverNoRulesMessage(dragData);
            });

            it('a new draft rule should be displayed on which to drop the suggestion', async () => {
                expect(await ruleList.getNewRule()).toBeTruthy();
            });

            describe('and then we drop the suggestion', () => {
                let ruleEditor;

                beforeAll(async () => {
                    [ruleEditor] = await Promise.all([extension.waitForNewRuleEditor(), ruleList.dropOnNoRulesMessage(dragData)])
                    await popup.close();
                    await ruleEditor.waitForFirstAction();
                });

                it('should have opened a new rule editor', () => {
                    expect(ruleEditor).toBeTruthy();
                });

                it('with one action', async () => {
                    expect(await ruleEditor.getNumberOfActions()).toBe(1);
                });

                it('that has the annoying popup page attached to it', async () => {
                    expect(await ruleEditor.getAttachedPageUrl()).toBe(annoyingPopupPage.url);
                });

                describe('and we look for a select action', () => {
                    let selectAction;

                    beforeAll(async () => {
                        const selectActions = await ruleEditor.waitForSelectActions();
                        selectAction = selectActions[0];
                    });

                    it('it should be there', () => {
                        expect(selectAction).toBeTruthy();
                    });

                    it('it should select the annoying backdrop', async () => {
                        expect(await selectAction.getSelectorValue()).toBe('div#backdrop.annoying-backdrop');
                    });

                    it('it should delete it', async () => {
                        expect(await selectAction.getDeletingNodeAction()).toBeTruthy();
                    });
                });

                describe('and then we go back to the popup', () => {
                    let newPopup;
                    let newRuleList;
                    let newSuggestionList;

                    beforeAll(async () => {
                        newPopup = await extension.openPopupForPage(annoyingPopupPage.url);
                        ([newRuleList, newSuggestionList] = await Promise.all([newPopup.waitForRuleList(), newPopup.waitForSuggestionList()]))
                        await Promise.all([newRuleList.whenNotLoading(), newSuggestionList.waitForFirstSuggestion()])
                    });

                    afterAll(async () => {
                        await newPopup.close();
                    });
        
                    it('there should no longer be a suggestion to delete', async () => {
                        expect((await newSuggestionList.getSuggestionsByDescription('delete')).length).toBe(0);
                    });
        
                    describe('and we look for a draft rule', () => {
                        let draftRule;
        
                        beforeAll(async () => {
                            draftRule = await newRuleList.getDraftRule();
                        });
        
                        it('it should be there', () => {
                            expect(draftRule).toBeTruthy();
                        });
        
                        it('it should be executable', async () => {
                            await draftRule.whenExecutable();
                        });
                    });
                });

                describe('and then we close the rule editor and open the popup again', () => {
                    let newPopup;
                    let newRuleList;
                    let newSuggestionList;

                    beforeAll(async () => {
                        await ruleEditor.close();
                        newPopup = await extension.openPopupForPage(annoyingPopupPage.url);
                        ([newRuleList, newSuggestionList] = await Promise.all([newPopup.waitForRuleList(), newPopup.waitForSuggestionList()]))
                        await Promise.all([newRuleList.whenNotLoading(), newSuggestionList.waitForFirstSuggestion()])
                    });

                    it('the draft rule shold be gone', async () => {
                        expect(await newRuleList.getDraftRule()).toBeFalsy();
                    });

                    it('a suggestion to delete should reappear when we refresh suggestions', async () => {
                        const [_, suggestionToDelete] = await Promise.all([
                            newSuggestionList.reload(),
                            newSuggestionList.waitForFirstSuggestionByDescription('delete')
                        ]);
                        expect(suggestionToDelete).toBeTruthy();
                    });
                });
            });
        });
    });
});