import { macros } from './shared/macros';

async function tryExecuteContentScript(tabId, frameId){
	try{
		await macros.tabs.executeScriptAsync('content-script.js', tabId, frameId);
	}catch(e){
		console.log(`could not execute content script on ${(frameId === undefined ? `all frames`: `frame ${frameId}`)} of tab ${tabId}: `, e);
	}
}

chrome.webNavigation.onCommitted.addListener(({tabId, frameId, url}) => {
	if(url === 'about:blank'){
		return;
	}
	tryExecuteContentScript(tabId, frameId);
});
macros.tabs.getAll(tabs => {
	for(let tabInfo of tabs){
		tryExecuteContentScript(tabInfo.tabId);
	}
});
macros.onNotifyContentScriptForUrl((url) => {
	console.log(`content script loaded on url ${url}`)
});
