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
					editable: r.editable,
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
			addActionToRule: function(rule){
				chrome.runtime.sendMessage(undefined, {addActionToRule: true, devtoolsTabId: tabId, ruleId: rule.ruleId});
			},
			addActionToNewRule: function(){
				chrome.runtime.sendMessage(undefined, {addActionToNewRule: true, devtoolsTabId: tabId});
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
					msg = msg.message;
					if(msg.currentlySelectedElement !== undefined){
						this.currentlySelectedElement = msg.currentlySelectedElement;
						this.setEffects(msg.effects);
					}else if(msg.currentRules !== undefined){
						this.setRules(msg.currentRules);
						this.setEffects(msg.effects);
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
				methods: {
					onAddActionClicked: function(){
						this.$emit('addactionclicked');
					}
				}
			}
		}
	})
})()