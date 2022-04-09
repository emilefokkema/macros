const { TestPagesClient } = require('./test-pages/client');
const { Extension } = require('./interaction/extension');

describe('given a rule that applies to the annoying popup page', () => {
    const ruleName = `for annoying popup`;
    let browser;
    let extension;
    let annoyingPopupPage;
    let testPagesClient;

    beforeAll(async () => {
        testPagesClient = new TestPagesClient();
        ({browser, extension} = await Extension.loadInBrowser());
        annoyingPopupPage = await testPagesClient.goToAnnoyingPopup((await browser.pages())[0]);
        await extension.addExistingRule({
            name: ruleName,
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
        let rule;
        let popup;

        beforeAll(async () => {
            popup = await extension.openPopupForPage(annoyingPopupPage.url);
            const ruleList = await popup.waitForRuleList();
            await ruleList.waitForFirstRule();
            [rule] = await ruleList.getRulesByName(ruleName);
        });

        it('the rule should be there', () => {
            expect(rule).toBeTruthy();
        });

        it('should be editable', async () => {
            await rule.whenEditable();
        });

        describe('and then we open the editor for the rule', () => {
            let ruleEditor;

            beforeAll(async () => {
                [ruleEditor] = await Promise.all([extension.waitForNewRuleEditor(), rule.edit()]);
                await popup.close();
            });

            describe('and then we open another annoying popup page', () => {
                let secondAnnoyingPopupPage;

                beforeAll(async () => {
                    // the editability of a rule is initially decided when the page opens. This is what
                    // might happen: 1. the editor for the rule is opened, 2. the annoying popup page is
                    // opened, it asks for the editability of the rule and the answer is yes, 3. the background
                    // knows the editor is opened and emits that a rule is now being edited, 4. the annoying popup
                    // page is done loading its rules and only now starts listening to the fact that a rule is being
                    // edited. This wait is to make sure 3 happens before 2. TODO: decide the editability of a rule
                    // when the popup opens
                    await new Promise(res => setTimeout(res, 200));
                    const page = await browser.newPage();
                    secondAnnoyingPopupPage = await testPagesClient.goToAnnoyingPopup(page);
                });

                describe('and then we open the popup for the second annoying popup page', () => {
                    let ruleInSecondPopup;
                    let secondPopup;

                    beforeAll(async () => {
                        secondPopup = await extension.openPopupForPage(secondAnnoyingPopupPage.url);
                        const ruleList = await secondPopup.waitForRuleList();
                        await ruleList.waitForFirstRule();
                        [ruleInSecondPopup] = await ruleList.getRulesByName(ruleName);
                    });

                    it('the rule should be there', () => {
                        expect(ruleInSecondPopup).toBeTruthy();
                    });
            
                    it('should not be editable', async () => {
                        await ruleInSecondPopup.whenNotEditable();
                    });

                    describe('and then we open the popup again for the first annoying popup page', () => {
                        let ruleInThirdPopup;
                        let thirdPopup;

                        beforeAll(async () => {
                            await secondPopup.close();
                            thirdPopup = await extension.openPopupForPage(annoyingPopupPage.url);
                            const ruleList = await thirdPopup.waitForRuleList();
                            await ruleList.waitForFirstRule();
                            [ruleInThirdPopup] = await ruleList.getRulesByName(ruleName);
                        });

                        it('the rule should be there', () => {
                            expect(ruleInThirdPopup).toBeTruthy();
                        });
                
                        it('should still be editable', async () => {
                            await ruleInThirdPopup.whenEditable();
                        });

                        describe('and then we close the editor', () => {

                            beforeAll(async () => {
                                await thirdPopup.close();
                                await ruleEditor.close();
                            });

                            describe('and then we open the popup again for the second annoying popup page', () => {
                                let ruleInFourthPopup;

                                beforeAll(async () => {
                                    const fourthPopup = await extension.openPopupForPage(secondAnnoyingPopupPage.url);
                                    const ruleList = await fourthPopup.waitForRuleList();
                                    await ruleList.waitForFirstRule();
                                    [ruleInFourthPopup] = await ruleList.getRulesByName(ruleName);
                                });

                                it('the rule should be there', () => {
                                    expect(ruleInFourthPopup).toBeTruthy();
                                });
                        
                                it('should now be editable', async () => {
                                    await ruleInFourthPopup.whenEditable();
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});