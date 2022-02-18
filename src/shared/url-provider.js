export class URLProvider{
    getURL(fileName){
        return chrome.runtime.getURL(fileName);
    }
}