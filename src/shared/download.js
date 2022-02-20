export class Download{
    download(options){
        return new Promise((res, rej) => {
            chrome.downloads.download(options, (downloadId) => {
                const error = chrome.runtime.lasError;
                if(!!error){
                    rej(error);
                    return;
                }
                res(downloadId);
            });
        });
    }
}