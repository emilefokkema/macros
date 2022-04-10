const { Extension } = require('./interaction/extension');
const { TestPagesClient } = require('./test-pages/client');

describe('when we create an automatic rule', () => {
    const ruleName = `remove backdrop`;
    let browser;
    let extension;
    let annoyingPopupPage;
    let ruleEditor;

    beforeAll(async () => {
        const testPagesClient = new TestPagesClient();
        ({browser, extension} = await Extension.loadInBrowser());
        annoyingPopupPage = await testPagesClient.goToAnnoyingPopup((await browser.pages())[0]);
        await annoyingPopupPage.whenPopupIsVisible();
        const popup = await extension.openPopupForPage(annoyingPopupPage.page.url());
        [ruleEditor] = await Promise.all([
            extension.waitForNewRuleEditor(),
            popup.addRule()
        ]);
        await popup.close();
        const actionAdder = await ruleEditor.getActionAdder();
        await actionAdder.chooseSelectAction();
        const [selectAction] = await Promise.all([
            ruleEditor.waitForSelectActionAtIndex(0),
            actionAdder.addAction()
        ]);
        await selectAction.setSelectorValue('#backdrop');
        await selectAction.createDeletingNodeAction();
        await ruleEditor.setName(ruleName);
        await ruleEditor.toggleAutomatic();
        await ruleEditor.save();
    });

    afterAll(async () => {
        await browser.close();
    });

    describe('and we go back to the annoying popup page', () => {

        beforeAll(async () => {
            await annoyingPopupPage.bringToFront();
        });

        it('the popup should already be gone', async () => {
            await annoyingPopupPage.whenPopupIsHidden();
        });

        describe('and then we try to show the popup by clicking the link', () => {

            beforeAll(async () => {
                await annoyingPopupPage.clickShowPopupLink();
            });

            it('the popup should not have reappeared', async () => {
                await new Promise(res => setTimeout(res, 1000));
                await annoyingPopupPage.whenPopupIsHidden();
            });

            describe('and then we change the rule to not-automatic', () => {

                beforeAll(async () => {
                    await ruleEditor.bringToFront();
                    await ruleEditor.toggleAutomatic();
                    await ruleEditor.save();
                });

                it('the popup should reappear when we click the link', async () => {
                    await annoyingPopupPage.bringToFront();
                    await annoyingPopupPage.showPopup();
                });
            });
        });
    });
});