const { Extension } = require('./interaction/extension');
const { TestPagesClient } = require('./test-pages/client');

describe('when we open the annoying popup page in an iframe', () => {
    let browser;
    let extension;
    let annoyingPopupPage;

    beforeAll(async () => {
        const testPagesClient = new TestPagesClient();
        ({browser, extension} = await Extension.loadInBrowser());
        annoyingPopupPage = await testPagesClient.goToIframeWithAnnoyingPopup((await browser.pages())[0]);
        await annoyingPopupPage.whenPopupIsVisible();
    });

    afterAll(async () => {
        await browser.close();
    });

    describe('and we open the popup for the annoying popup page', () => {
        let popup;

        beforeAll(async () => {
            popup = await extension.openPopupForPage(annoyingPopupPage.url);
        });

        describe('and we select the navigation corresponding to the iframe', () => {
            let deleteSuggestion;

            beforeAll(async () => {
                const navigationSelector = await popup.getNavigationSelector();
                await navigationSelector.selectOptionByText('localhost (2)');
                const suggestionList = await popup.waitForSuggestionList();
                deleteSuggestion = await suggestionList.waitForFirstSuggestionByDescription('delete')
            });

            it('there should be a suggestion to delete something', () => {
                expect(deleteSuggestion).toBeTruthy();
            });

            describe('and when we execute that suggestion', () => {

                beforeAll(async () => {
                    await deleteSuggestion.execute();
                    await annoyingPopupPage.bringToFront();
                });

                it('the annoying popup should be gone', async () => {
                    await annoyingPopupPage.whenPopupIsHidden();
                });
            });
        });
    });
});