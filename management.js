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
				rules: []
			};
		},
		mounted: function(){
			this.initialize();
		},
		methods: {
			initialize: async function(){
				var initMsg = await initializedPromise;
				this.rules = initMsg.rules;
				console.log(`rules:`, this.rules)
			}
		},
		components: {
			rule: {
				template: document.getElementById("ruleTemplate").innerHTML,
				props: {
					rule: Object
				}
			}
		}
	})
})()