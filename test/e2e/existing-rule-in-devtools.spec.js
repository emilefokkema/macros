const { TestPagesClient } = require('./test-pages/client');
const { Extension } = require('./interaction/extension');

describe('given a rule that hides the annoying popup', () => {
    const existingRuleName = 'hide popup';
    let browser;
    let extension;
    let annoyingPopupPage;

    beforeAll(async () => {
        const testPagesClient = new TestPagesClient();
        ({browser, extension} = await Extension.loadInBrowser({devtools: true}));
        annoyingPopupPage = await testPagesClient.goToAnnoyingPopup((await browser.pages())[0]);
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
        await annoyingPopupPage.whenPopupIsVisible();
    });

    afterAll(async () => {
        await browser.close();
    });

    describe('and we open the devtools side bar and we select the backdrop element in the elements panel', () => {
        let sidebar;
        let elementsPanel;

        beforeAll(async () => {
            ({elementsPanel, sidebar} = await extension.getDevtoolsSidebarForPage(annoyingPopupPage.page));
            await elementsPanel.selectTreeItemWhoseTextMatches('id="backdrop"');
        });

        it('the existing rule should be there with the correct effect description', async () => {
            const rule = await sidebar.waitForRuleByName(existingRuleName);
            expect(rule).toBeTruthy();
            await rule.waitForEffectDescription('will delete this element');
        });
    });
});