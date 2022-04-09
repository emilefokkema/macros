const { TestPagesClient } = require('./test-pages/client');
const { Extension } = require('./interaction/extension');

describe('when we open a new rule editor', () => {
    let browser;
    let extension;
    let annoyingPopupPage;
    let ruleEditor;

    beforeAll(async () => {
        const testPagesClient = new TestPagesClient();
        ({browser, extension} = await Extension.loadInBrowser());
        annoyingPopupPage = await testPagesClient.goToAnnoyingPopup((await browser.pages())[0]);
        const popup = await extension.openPopupForPage(annoyingPopupPage.page.url());
        [ruleEditor] = await Promise.all([
            extension.waitForNewRuleEditor(),
            popup.addRule()
        ])
    });

    afterAll(async () => {
        await browser.close();
    });

    describe('and we add a select action', () => {
        let selectAction;

        beforeAll(async () => {
            const actionAdder = await ruleEditor.getActionAdder();
            await actionAdder.chooseSelectAction();
            [selectAction] = await Promise.all([
                ruleEditor.waitForSelectActionAtIndex(0),
                actionAdder.addAction()
            ])
        });

        describe('if we try to save', () => {

            beforeAll(async () => {
                await ruleEditor.save();
            });

            it('should have two errors', async () => {
                await selectAction.selectorRequired.whenPresent();
                await selectAction.actionRequired.whenPresent();
            });

            it('should not be executable', async () => {
                await selectAction.whenNotExecutable();
            });

            describe('and then we type a valid selector', () => {

                beforeAll(async () => {
                    await selectAction.setSelectorValue('a');
                });

                it('should have one error', async () => {
                    await selectAction.selectorRequired.whenAbsent();
                    await selectAction.actionRequired.whenPresent();
                });

                describe('and then we select a node action', () => {

                    beforeAll(async () => {
                        await selectAction.createDeletingNodeAction();
                    });

                    it('should have no error', async () => {
                        await selectAction.selectorRequired.whenAbsent();
                        await selectAction.actionRequired.whenAbsent();
                    });

                    it('should be executable', async () => {
                        await selectAction.whenExecutable();
                    });

                    describe('and then we type an invalid selector', () => {

                        beforeAll(async () => {
                            await selectAction.setSelectorValue('a+');
                        });

                        it('should have an error', async () => {
                            await selectAction.selectorInvalid.whenPresent();
                        });

                        it('should not be executable', async () => {
                            await selectAction.whenNotExecutable();
                        });

                        describe('and then we remove the name', () => {

                            beforeAll(async () => {
                                await ruleEditor.setName('');
                            });

                            it('should have an error', async () => {
                                await ruleEditor.nameRequired.whenPresent();
                            });
                        });
                    });
                });
            });
        });
    });
});