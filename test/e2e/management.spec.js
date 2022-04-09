const { TestPagesClient } = require('./test-pages/client');
const { Extension } = require('./interaction/extension');
const path = require('path');
const fs = require('fs');

describe('given a rule', () => {
    const existingRuleName = 'hide popup';
    let browser;
    let extension;
    let annoyingPopupPage;

    beforeAll(async () => {
        const testPagesClient = new TestPagesClient();
        ({browser, extension} = await Extension.loadInBrowser());
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
    });

    afterAll(async () => {
        await browser.close();
    });

    describe('and we open the management page from the popup', () => {
        let managementPage;
        let rule;

        beforeAll(async () => {
            const popup = await extension.openPopupForPage(annoyingPopupPage.page.url());
            [managementPage] = await Promise.all([
                extension.waitForManagementPage(),
                popup.goToManagementPage()
            ]);
            rule = await managementPage.waitForRuleByName(existingRuleName);
        });

        it('should be there', () => {
            expect(managementPage).toBeTruthy();
        });

        it('should display the rule', () => {
            expect(rule).toBeTruthy();
        });

        it('the rule should be deletable', async () => {
            await rule.whenDeletable();
        });

        describe('and we open an editor for the rule and go back to the management page', () => {
            let ruleEditor;

            beforeAll(async () => {
                [ruleEditor] = await Promise.all([
                    extension.waitForNewRuleEditor(),
                    rule.edit()
                ]);
                await managementPage.page.bringToFront();
            });

            it('the rule should not be deletable', async () => {
                await rule.whenNotDeletable();
            });

            describe('and then we close the editor', () => {

                beforeAll(async () => {
                    await ruleEditor.close();
                });

                it('the rule should be deletable', async () => {
                    await rule.whenDeletable();
                });
            });
        });

        describe('and we click the upload button and upload a file', () => {
            const otherRuleName = `also hide popup`;
            let filePath;
            let otherRule;

            beforeAll(async () => {
                filePath = path.resolve(__dirname, 'temp-rules.json');
                const otherRuleDefinition = {
                    name: otherRuleName,
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
                fs.writeFileSync(filePath, JSON.stringify([otherRuleDefinition]), {encoding: 'utf8'});
                const [fileChooser] = await Promise.all([
                    managementPage.page.waitForFileChooser(),
                    managementPage.upload()
                ]);
                await fileChooser.accept([filePath]);
                otherRule = await managementPage.waitForRuleByName(otherRuleName);
            });

            afterAll(() => {
                fs.unlinkSync(filePath);
            });

            it('should display the uploaded rule', () => {
                expect(otherRule).toBeTruthy();
            });
        });
    });
});