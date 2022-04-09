const { Extension } = require('./interaction/extension');
const { TestPagesClient } = require('./test-pages/client');

describe('when we have the extension and we navigate to a page that hides its overflow and displays a popup', () => {
    let annoyingPopupPage;
    let browser;
    let extension;
    let testPagesClient;

    beforeAll(async () => {
        testPagesClient = new TestPagesClient();
        const {browser: _browser, extension: _extension} = await Extension.loadInBrowser();
        browser = _browser;
        extension = _extension;
        annoyingPopupPage = await testPagesClient.goToAnnoyingPopup((await browser.pages())[0]);
        await annoyingPopupPage.whenPopupIsVisible();
    });

    afterAll(async () => {
        await browser.close();
    });

    describe('and then we open the popup for that page', () => {
        let popup;

        beforeAll(async () => {
            popup = await extension.openPopupForPage(annoyingPopupPage.url);
        });

        describe('and then the popup displays a list of suggestions', () => {
            let suggestionList;

            beforeAll(async () => {
                suggestionList = await popup.waitForSuggestionList();
                await suggestionList.waitForFirstSuggestion();
            });

            it('it should display two suggestions', async () => {
                expect(await suggestionList.getNumberOfSuggestions()).toBe(2);
            });

            describe('and then the suggestion to delete is executed', () => {
                let suggestionToDelete;

                beforeAll(async () => {
                    suggestionToDelete = (await suggestionList.getSuggestionsByDescription('delete'))[0];
                    await suggestionToDelete.execute();
                    await annoyingPopupPage.bringToFront();
                });

                it('should have removed the annoying backdrop from the affected page', async () => {
                    await annoyingPopupPage.whenPopupIsHidden();
                });

                describe('and then the same suggestion is undone', () => {

                    beforeAll(async () => {
                        await popup.bringToFront();
                        await suggestionToDelete.undo();
                        await annoyingPopupPage.bringToFront();
                    });

                    it('should have put the annoying popup back', async () => {
                        await annoyingPopupPage.whenPopupIsVisible();
                    });
                });
            });
        });
    });
});