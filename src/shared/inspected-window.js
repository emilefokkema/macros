import { PromiseResolver } from './promise-resolver';

var inspectedWindow = {
    get tabId(){return chrome.devtools.inspectedWindow.tabId;},
    eval(expression, options){
        var resolver = new PromiseResolver();
        chrome.devtools.inspectedWindow.eval(expression, options, (result, exceptionInfo) => {
            if(exceptionInfo){
                resolver.reject(exceptionInfo);
            }else{
                resolver.resolve(result);
            }
        });
        return resolver.promise;
    }
};

export { inspectedWindow }