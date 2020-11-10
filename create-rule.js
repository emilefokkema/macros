(function(){
		var resolveInitialized, initializedPromise = new Promise((res) => {resolveInitialized = res;});
		chrome.runtime.onMessage.addListener((msg, sender) => {
			if(msg.initialize){
				resolveInitialized(msg);
			}
		});
		new Vue({
			el: '#app',
			data: function(){
				return {
					url: undefined
				};
			},
			mounted: async function(){
				var initMsg = await initializedPromise;
				this.url = initMsg.url;
			},
			methods: {
				gotoPage: function(){
					chrome.runtime.sendMessage(undefined, {focusPage: true});
				}
			}
		});
		

	})();