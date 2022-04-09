const { Extension } = require('./interaction/extension');
const { TestPagesClient } = require('./test-pages/client');
const { compressToEncodedURIComponent } = require('lz-string');

describe('when we open the annoying popup page using a url that has a rule for it', () => {
    const existingRuleName = 'hide popup';
    let browser;
    let extension;
    let annoyingPopupPage;

    beforeAll(async () => {
        const testPagesClient = new TestPagesClient();
        ({browser, extension} = await Extension.loadInBrowser());
        const page = (await browser.pages())[0];
        annoyingPopupPage = await testPagesClient.goToAnnoyingPopup(page);
        await extension.waitForServiceWorkerWithBackgroundLoaded();
        const rule = {
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
        };
        const compressed = compressToEncodedURIComponent(JSON.stringify(rule));
        const url = new URL(page.url());
        url.hash = `toolrule${compressed}`;
        const newUrl = url.toString();
        await page.goto(newUrl, { waitUntil: 'load' });
        await page.reload();
        await annoyingPopupPage.whenPopupIsVisible();
    });

    afterAll(async () => {
        await browser.close();
    });

    describe('and then we open the popup for the annoying popup page', () => {
        let rule;

        beforeAll(async () => {
            const popup = await extension.openPopupForPage(annoyingPopupPage.page.url());
            const ruleList = await popup.waitForRuleList();
            rule = await ruleList.waitForFirstRule();
        });

        it('should have a rule', async () => {
            expect(rule).toBeTruthy();
            await rule.whenExecutable();
            expect(await rule.getName()).toEqual(existingRuleName);
        });

        describe('and then we execute the rule and go back to the annoying popup page', () => {

            beforeAll(async () => {
                await rule.execute();
                await annoyingPopupPage.bringToFront();
            });

            it('the annoying popup should be gone', async () => {
                await annoyingPopupPage.whenPopupIsHidden();
            });
        });
    });
});