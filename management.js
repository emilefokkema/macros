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
				chrome.runtime.onMessage.addListener((msg) => {
					if(msg.deletableRulesChange){
						this.setNonDeletable(msg.nonDeletable);
					}else if(msg.rulesChanged){
						this.rules = msg.rules;
					}
				});
			},
			setNonDeletable: function(nonDeletableRuleIds){
				for(var rule of this.rules){
					rule.deletable = !nonDeletableRuleIds.some(id => id === rule.ruleId);
				}
			},
			onEditRuleClicked: function(rule){
				chrome.runtime.sendMessage(undefined, {editRule: true, ruleId: rule.ruleId});
			},
			onDeleteRuleClicked: function(rule){
				if(confirm(`Are you sure you want to delete '${rule.rule.name}'?`)){
					chrome.runtime.sendMessage(undefined, {deleteRule: true, ruleId: rule.ruleId}, resp => {
						var index = this.rules.indexOf(rule);
						if(index > -1){
							this.rules.splice(index, 1);
						}
					});
				}
			}
		},
		components: {
			rule: {
				template: document.getElementById("ruleTemplate").innerHTML,
				props: {
					rule: Object
				},
				methods: {
					onDeleteClicked: function(){
						this.$emit('deleteruleclicked')
					},
					onEditClicked: function(){
						this.$emit('editruleclicked')
					}
				}
			}
		}
	})
})()