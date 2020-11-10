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
					url: undefined,
					name: undefined,
					isNew: true
				};
			},
			mounted: async function(){
				var initMsg = await initializedPromise;
				this.isNew = initMsg.isNew;
				if(this.isNew){
					this.url = initMsg.url;
				}
			},
			methods: {
				setRule: function(rule){
					this.name = rule.name;
				},
				gotoPage: function(){
					chrome.runtime.sendMessage(undefined, {focusPage: true});
				},
				saveRule: function(){
					var rule = {name: this.name};
					chrome.runtime.sendMessage(undefined, {createdRule: rule}, (resp) => {
						this.isNew = false;
						this.setRule(resp.rule);
					});
				}
			}
		});
		

	})();