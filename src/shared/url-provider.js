export class URLProvider{
    getURL(fileName){
        return chrome.extension.getURL(fileName);
    }
}