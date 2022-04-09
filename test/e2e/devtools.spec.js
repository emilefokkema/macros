const { TestPagesClient } = require('./test-pages/client');
const { Extension } = require('./interaction/extension');

describe('when we open the annoying popup page with devtools', () => {
    let browser;
    let extension;
    let annoyingPopupPage;

    beforeAll(async () => {
        const testPagesClient = new TestPagesClient();
        ({browser, extension} = await Extension.loadInBrowser({devtools: true}));
        annoyingPopupPage = await testPagesClient.goToAnnoyingPopup((await browser.pages())[0]);
        await annoyingPopupPage.whenPopupIsVisible();
    });

    afterAll(async () => {
        await browser.close();
    });

    describe('and we open the devtools side bar', () => {
        let sidebar;
        let elementsPanel;
        let newRule;

        beforeAll(async () => {
            ({elementsPanel, sidebar} = await extension.getDevtoolsSidebarForPage(annoyingPopupPage.page));
            newRule = await sidebar.waitForNewRule();
        });

        it('it should be there', () => {
            expect(sidebar).toBeTruthy();
        });

        it('should display a selector', async () => {
            await sidebar.waitForSelectorDisplay();
        });

        it('should mention a new rule', () => {
            expect(newRule).toBeTruthy();
        });

        describe('and then we select the backdrop in the elements panel', () => {

            beforeAll(async () => {
                await elementsPanel.selectTreeItemWhoseTextMatches('id="backdrop"');
            });

            it('should display a selector with the appropriate text', async () => {
                await sidebar.waitForSelectorDisplayWithText(`div#backdrop.annoying-backdrop[class][id]`)
            });

            describe('and then we add an action to a new rule for the selected element', () => {
                let ruleEditor;
                let selectAction;

                beforeAll(async () => {
                    [ruleEditor] = await Promise.all([
                        extension.waitForNewRuleEditor(),
                        newRule.addAction()
                    ]);
                    selectAction = await ruleEditor.waitForSelectActionAtIndex(0);
                });

                it('should open a rule editor', () => {
                    expect(ruleEditor).toBeTruthy();
                });

                it('with a select action for the selected element', async () => {
                    expect(selectAction).toBeTruthy();
                    expect(await selectAction.getSelectorValue()).toEqual(`div#backdrop.annoying-backdrop`);
                });

                describe('and then we make it so that the selected element will be deleted', () => {

                    beforeAll(async () => {
                        await selectAction.createDeletingNodeAction();
                    });

                    describe('and then we go back to the annoying popup page and its devtools page', () => {

                        beforeAll(async () => {
                            await annoyingPopupPage.bringToFront();
                        });

                        it('should have a draft rule with the correct effect description', async () => {
                            const draftRule = await sidebar.waitForDraftRule();
                            expect(draftRule).toBeTruthy();
                            await draftRule.waitForEffectDescription('will delete this element');
                        });
                    });
                });
            });
        });
    });
});