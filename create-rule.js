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
					hasPage: false,
					ruleId: undefined
				};
			},
			mounted: function(){
				this.initialize();
				chrome.runtime.onMessage.addListener((msg, sender) => {
					if(msg.pageDestroyed){
						this.hasPage = false;
					}
				});
			},
			computed: {
				isNew: function(){
					return this.ruleId === undefined;
				}
			},
			methods: {
				initialize: async function(){
					var initMsg = await initializedPromise;
					if(initMsg.url){
						this.url = initMsg.url;
						this.hasPage = true;
					}
					if(initMsg.ruleId){
						this.ruleId = initMsg.ruleId;
						this.setRule(initMsg.rule);
					}
				},
				setRule: function(rule){
					this.name = rule.name;
					this.setTitle();
				},
				setTitle: function(){
					document.title = `Edit '${this.name}'`
				},
				gotoPage: function(){
					chrome.runtime.sendMessage(undefined, {focusPage: true});
				},
				saveRule: function(){
					var rule = {name: this.name};
					if(this.isNew){
						chrome.runtime.sendMessage(undefined, {createdRule: rule}, (msg) => {
							this.ruleId = msg.ruleId;
							this.setTitle();
						});
					}else{
						chrome.runtime.sendMessage(undefined, {updatedRule: rule}, (msg) => {
							this.setTitle();
						});
					}
				}
			}
		});
		

	})();