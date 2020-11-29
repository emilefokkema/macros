(function(){
	var tabId = chrome.devtools.inspectedWindow.tabId;
	new Vue({
		el: "#app",
		data: function(){
			return {
				currentlySelectedElement: undefined,
				currentRules: []
			};
		},
		mounted: function(){
			this.initialize();
		},
		methods: {
			setRules: function(rules){
				this.currentRules = rules.map(r => ({
					ruleId: r.ruleId,
					rule: r.rule,
					effect: []
				}))
			},
			setEffects: function(effects){
				for(var effect of effects){
					var rule = this.currentRules.find(r => r.ruleId === effect.ruleId);
					if(!rule){
						continue;
					}
					rule.effect = effect.effect;
				}
			},
			initialize: async function(){
				chrome.runtime.sendMessage(undefined, {devtoolsSidebarOpened: true, devtoolsTabId: tabId}, (init) => {
					this.currentlySelectedElement = init.currentlySelectedElement;
					this.setRules(init.currentRules);
					this.setEffects(init.effects);
				});
				chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
					if(msg.destinationDevtoolsTabId !== tabId){
						return;
					}
					if(msg.message.currentlySelectedElement !== undefined){
						this.currentlySelectedElement = msg.message.currentlySelectedElement;
						this.setEffects(msg.message.effects);
					}
				});
			}
		},
		components: {
			node: {
				template: document.getElementById("nodeTemplate").innerHTML,
				props: {
					node: Object
				},
			},
			rule: {
				template: document.getElementById("ruleTemplate").innerHTML,
				props: {
					rule: Object
				},
			}
		}
	})
})()