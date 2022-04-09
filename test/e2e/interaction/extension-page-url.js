const { escapeRegex } = require('../util/escape-regex');

class UrlData{
    constructor(text, regex){
        this.text = text;
        this.regex = regex;
    }
    static create(text){
        return new UrlData(text, new RegExp(escapeRegex(text)));
    }
}
class ExtensionPageUrl{
    constructor(itself, inSandbox){
        this.itself = itself;
        this.inSandbox = inSandbox;
    }
    static async create(relativeUrl, getExtensionId){
        const searchParams = new URLSearchParams();
        searchParams.set('page', relativeUrl);
        const sandboxRelativeUrl = `sandbox.html?${searchParams}`;
        const extensionId = await getExtensionId();
        return new ExtensionPageUrl(
            UrlData.create(`chrome-extension://${extensionId}/${relativeUrl}`),
            UrlData.create(`chrome-extension://${extensionId}/${sandboxRelativeUrl}`)
        )
    }
}

module.exports = { ExtensionPageUrl }