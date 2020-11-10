(async function(){
	var contentScriptId = +new Date() - Math.floor(Math.random() * 1000);
	console.log(`hello from content script ${contentScriptId}`)
	chrome.runtime.onMessage.addListener((msg, sender) => {
		if(msg.stopContentScript && msg.contentScriptId === contentScriptId){
			console.log(`bye from content script ${contentScriptId}`)
		}
	});
	chrome.runtime.sendMessage(undefined, {contentScriptLoaded: true, contentScriptId: contentScriptId});
})();
