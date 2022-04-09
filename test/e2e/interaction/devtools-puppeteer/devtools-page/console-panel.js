class ConsolePanel{
    constructor(element, page){
        this.element = element;
        this.page = page;
    }
    waitForConsoleMessageByText(text){
        return this.page.waitForXPath(`//*[@class='console-message-text' and text() = '${text}']`);
    }
}

module.exports = { ConsolePanel }