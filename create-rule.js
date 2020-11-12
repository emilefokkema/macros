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
					ruleId: undefined,
					urlPattern: undefined
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
					}else{
						this.urlPattern = this.url;
					}
				},
				setRule: function(rule){
					this.name = rule.name;
					this.urlPattern = rule.urlPattern;
					this.setTitle();
				},
				setTitle: function(){
					document.title = `Edit '${this.name}'`
				},
				gotoPage: function(){
					chrome.runtime.sendMessage(undefined, {focusPage: true});
				},
				saveRule: function(){
					var rule = {
						name: this.name,
						urlPattern: this.urlPattern
					};
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
			},
			components: {
				'class-finder': {
					template: document.getElementById("classFinderTemplate").innerHTML,
					data: function(){
						return {
							queryProperties: [
								{
									property: undefined,
									value: undefined,
									comparison: "eq"
								}
							]
						};
					},
					methods: {
						search: function(){
							chrome.runtime.sendMessage(undefined, {findClass: true, req: {properties: this.queryProperties}});
						}
					},
					components: {
						'query-property': {
							template: document.getElementById("queryPropertyTemplate").innerHTML,
							props: {
								property: Object
							}
						}
					}
				}
			}
		});
	})();