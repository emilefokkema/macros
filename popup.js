(function(){
	var initialized = false;
	function initialize(info){
		var url = info.url;
		document.getElementById("url").innerText = url;
		document.getElementById("add-button").addEventListener("click", () => {
			chrome.runtime.sendMessage(undefined, {createRuleForPage: true, pageId: info.pageId});
			window.close();
		});
	}
	chrome.runtime.onMessage.addListener((msg, sender) => {
		if(msg.popupInfo && !initialized){
			initialize(msg.popupInfo);
			initialized = true;
		}
	});
	chrome.runtime.sendMessage(undefined, {popupOpened: true})
})();