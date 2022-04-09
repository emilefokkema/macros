const { Extension } = require('./interaction/extension');
const { TestPagesClient } = require('./test-pages/client');

describe('when we open the annoying popup page', () => {
    let browser;
    let extension;
    let annoyingPopupPage;

    beforeAll(async () => {
        const testPagesClient = new TestPagesClient();
        ({browser, extension} = await Extension.loadInBrowser());
        annoyingPopupPage = await testPagesClient.goToAnnoyingPopup((await browser.pages())[0]);
        await annoyingPopupPage.whenPopupIsVisible();
    });

    afterAll(async () => {
        await browser.close();
    });

    describe('and we open the popup for the annoying popup page', () => {
        let popup, suggestionList;

        beforeAll(async () => {
            popup = await extension.openPopupForPage(annoyingPopupPage.url);
            suggestionList = await popup.waitForSuggestionList();
        });

        it('there should be a suggestion to delete something', async () => {
            await suggestionList.waitForFirstSuggestionByDescription('delete');
        });

        describe('and we open a new rule editor from the popup', () => {
            let editor;
    
            beforeAll(async () => {
                [editor] = await Promise.all([extension.waitForNewRuleEditor(), popup.addRule()]);
                await popup.close();
            });
    
            it('it should be there', () => {
                expect(editor).toBeTruthy();
            });
    
            it('should have a name', async () => {
                expect(await editor.waitForName()).toBe(new URL(annoyingPopupPage.url).hostname);
            });
    
            it('should have a url pattern', async () => {
                expect(await editor.waitForUrlPattern()).toBe(`${new URL(annoyingPopupPage.url).origin}/*`);
            });
    
            it('should have the annoying popup page attached to it', async () => {
                expect(await editor.getAttachedPageUrl()).toBe(annoyingPopupPage.url);
            });
    
            describe('and then we open the popup for the annoying popup page', () => {
                let draftRule, secondPopup;
    
                beforeAll(async () => {
                    secondPopup = await extension.openPopupForPage(annoyingPopupPage.url);
                    const ruleList = await secondPopup.waitForRuleList();
                    await ruleList.whenNotLoading();
                    draftRule = await ruleList.waitForDraftRule();
                });
    
                afterAll(async () => {
                    await secondPopup.close();
                });
    
                it('there should be a draft rule', () => {
                    expect(draftRule).toBeTruthy();
                });
    
                it('it should not be executable', async () => {
                    await draftRule.whenNotExecutable();
                });
            });
    
            describe('and then we add an action that deletes the annoying popup', () => {
                const ruleName = `remove popup`;
                let selectAction;
    
                beforeAll(async () => {
                    await editor.setName(ruleName);
                    const actionAdder = await editor.getActionAdder();
                    await actionAdder.chooseSelectAction();
                    [selectAction] = await Promise.all([editor.waitForSelectActionAtIndex(0), actionAdder.addAction()]);
                    await selectAction.setSelectorValue('div.annoying-backdrop');
                    await selectAction.createDeletingNodeAction();
                });
    
                it('should be executable', async () => {
                    await selectAction.whenExecutable();
                });
    
                describe('and then we open the popup for the annoying popup page', () => {
                    let draftRule, thirdPopup, suggestionList;
        
                    beforeAll(async () => {
                        thirdPopup = await extension.openPopupForPage(annoyingPopupPage.url);
                        let ruleList;
                        [ruleList, suggestionList] = await Promise.all([thirdPopup.waitForRuleList(), thirdPopup.waitForSuggestionList()]);
                        await suggestionList.waitForFirstSuggestionByDescription('delete');
                        await ruleList.whenNotLoading();
                        draftRule = await ruleList.waitForDraftRule();
                    });
        
                    afterAll(async () => {
                        await thirdPopup.close();
                    });
        
                    it('there should be a draft rule', () => {
                        expect(draftRule).toBeTruthy();
                    });
    
                    it('it should be executable', async () => {
                        await draftRule.whenExecutable();
                    });

                    it('it should have the same name', async () => {
                        expect(await draftRule.getName()).toBe(ruleName);
                    });

                    it('there should no longer be a suggestion to delete something when we refresh the suggestions', async () => {
                        await suggestionList.reload();
                        await suggestionList.waitForSuggestionByDescriptionAtIndex('show overflow', 0);
                        await suggestionList.whenNoSuggestionByDescription('delete');
                    });
                });
    
                describe('and then we execute the new action and look at the annoying popup page', () => {
    
                    beforeAll(async () => {
                        await selectAction.execute();
                        await annoyingPopupPage.bringToFront();
                    });
    
                    it('the popup should be gone', async () => {
                        await annoyingPopupPage.whenPopupIsHidden();
                    });
                });

                describe('and then we save the rule', () => {

                    beforeAll(async () => {
                        await editor.bringToFront();
                        await editor.save();
                    });

                    describe('and we again open the popup for the annoying popup page', () => {
                        let fourthPopup, rule;

                        beforeAll(async () => {
                            fourthPopup = await extension.openPopupForPage(annoyingPopupPage.url);
                            const ruleList = await fourthPopup.waitForRuleList();
                            await ruleList.waitForFirstRule();
                            [rule] = await ruleList.getRulesByName(ruleName);
                        });

                        afterAll(async () => {
                            await fourthPopup.close();
                        });

                        it('the rule should not be executable', async () => {
                            await rule.whenNotExecutable();
                        });
                    });
                });

                describe('and then we change the name and save again', () => {
                    const otherRuleName = `really remove popup`;
                    
                    beforeAll(async () => {
                        await editor.setName(otherRuleName);
                        await editor.save();
                    });

                    describe('and then we again open the popup for the annoying popup page', () => {
                        let fifthPopup, rule, ruleList;

                        beforeAll(async () => {
                            fifthPopup = await extension.openPopupForPage(annoyingPopupPage.url);
                            ruleList = await fifthPopup.waitForRuleList();
                            await ruleList.waitForFirstRule();
                            [rule] = await ruleList.getRulesByName(otherRuleName);
                        });

                        afterAll(async () => {
                            await fifthPopup.close();
                        });

                        it('the rule should appear under the new name', () => {
                            expect(rule).toBeTruthy();
                        });

                        it('there should still be only one rule', async () => {
                            expect((await ruleList.getRules()).length).toBe(1);
                        });
                    });
                });
            });
        });
    });
});