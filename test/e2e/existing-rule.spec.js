const { TestPagesClient } = require('./test-pages/client');
const { Extension } = require('./interaction/extension');

describe('given a rule that hides the annoying popup', () => {
    const existingRuleName = 'hide popup';
    let browser;
    let extension;
    let annoyingPopupPage;

    beforeAll(async () => {
        const testPagesClient = new TestPagesClient();
        const {browser: _browser, extension: _extension} = await Extension.loadInBrowser();
        browser = _browser;
        extension = _extension;
        annoyingPopupPage = await testPagesClient.goToAnnoyingPopup((await browser.pages())[0], {manual: true});
        await extension.addExistingRule({
            name: existingRuleName,
            urlPattern: `${new URL(annoyingPopupPage.page.url()).origin}/*`,
            automatic: false,
            actions: [
                {
                    type: 'select',
                    selector: 'div.annoying-backdrop',
                    action: {type: 'delete'}
                }
            ]
        });
        await annoyingPopupPage.reload();
    });

    afterAll(async () => {
        await browser.close();
    });

    describe('and then we open the popup for the annoying popup page', () => {
        let popup;
        let ruleList;
        let suggestionList;

        beforeAll(async () => {
            popup = await extension.openPopupForPage(annoyingPopupPage.url);
            ([ruleList, suggestionList] = await Promise.all([popup.waitForRuleList(), popup.waitForSuggestionList()]))
            await ruleList.waitForFirstRule();
        });

        describe('and we look for the rule', () => {
            let rule;

            beforeAll(async () => {
                const rules = await ruleList.getRulesByName(existingRuleName);
                rule = rules[0];
            });

            it('it should be there', () => {
                expect(rule).toBeTruthy();
            });

            it('it should not be executable', async () => {
                await rule.whenNotExecutable();
            });

            it('it should be editable', async () => {
                await rule.whenEditable();
            });

            describe('and then the annoying popup becomes visible', () => {

                beforeAll(async () => {
                    await annoyingPopupPage.bringToFront();
                    await annoyingPopupPage.showPopup();
                    await popup.bringToFront();
                });

                it('it should be executable', async () => {
                    await rule.whenExecutable();
                });
            });

            describe('and when we execute it', () => {

                beforeAll(async () => {
                    await rule.execute();
                });

                describe('and we go back to the annoying popup page', () => {

                    beforeAll(async () => {
                        await annoyingPopupPage.bringToFront();
                    });

                    it('should have removed the annoying backdrop from the affected page', async () => {
                        await annoyingPopupPage.whenPopupIsHidden();
                    });
                });
            });

            describe('and we go back to the popup and look for the other suggestion', () => {
                let suggestionToShowOverflow;

                beforeAll(async () => {
                    await popup.bringToFront();
                    [suggestionToShowOverflow] = await Promise.all([
                        suggestionList.waitForFirstSuggestionByDescription('show overflow'),
                        suggestionList.reload()
                    ]);
                });

                it('it should be there', () => {
                    expect(suggestionToShowOverflow).toBeTruthy();
                });

                describe('and we begin dragging the other suggestion', () => {
                    let dragData;

                    beforeAll(async () => {
                        dragData = await suggestionToShowOverflow.beginDragging();
                    });

                    it('the rule list should display a new rule', async () => {
                        expect(await ruleList.getNewRule()).toBeTruthy();
                    });

                    describe('and we drop the suggestion on the existing rule', () => {

                        beforeAll(async () => {
                            await rule.drop(dragData);
                        });

                        it('there should be no more suggestions', async () => {
                            await suggestionList.whenEmpty();
                        });

                        it('the rule should be executable', async () => {
                            await rule.whenExecutable();
                        });
                    });
                });
            });

            describe('and then we begin to edit the rule', () => {
                let ruleEditor;

                beforeAll(async () => {
                    [ruleEditor] = await Promise.all([extension.waitForNewRuleEditor(), rule.edit()])
                });

                it('the editor should have the annoying popup page attached to it', async () => {
                    expect(await ruleEditor.getAttachedPageUrl()).toBe(annoyingPopupPage.url);
                });

                describe('and we look for two select actions', () => {
                    let firstSelectAction, secondSelectAction;

                    beforeAll(async () => {
                        [firstSelectAction, secondSelectAction] = await ruleEditor.waitForSelectActions();
                    });

                    it('they should be there', () => {
                        expect(firstSelectAction).toBeTruthy();
                        expect(secondSelectAction).toBeTruthy();
                    });

                    it('the first should be the existing one', async () => {
                        expect(await firstSelectAction.getSelectorValue()).toBe('div.annoying-backdrop');
                        expect(await firstSelectAction.getDeletingNodeAction()).toBeTruthy();
                    });

                    it('the second should be the one from the suggestion', async () => {
                        expect(await secondSelectAction.getSelectorValue()).toBe('.has-popup');
                        expect(await (await secondSelectAction.getClassRemovingNodeAction()).getClassName()).toBe('has-popup');
                    });
                });
            });
        });
    });
});
