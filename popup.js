(function(){
	var resolveInitialized, initializedPromise = new Promise((res) => {resolveInitialized = res;});
	chrome.runtime.onMessage.addListener((msg, sender) => {
		if(msg.popupInfo){
			resolveInitialized(msg.popupInfo);
		}
	});
	chrome.runtime.sendMessage(undefined, {popupOpened: true});

	new Vue({
		el: '#app',
		data: function(){
			return {
				pageId: undefined,
				rules: []
			};
		},
		mounted: function(){
			this.initialize();
		},
		methods: {
			onExecuteClicked: function(ruleId){
				chrome.runtime.sendMessage(undefined, {executeRule: true, pageId: this.pageId, ruleId: ruleId});
			},
			onEditClicked: function(ruleId){
				chrome.runtime.sendMessage(undefined, {editRule: true, pageId: this.pageId, ruleId: ruleId});
				window.close();
			},
			addRule: function(){
				chrome.runtime.sendMessage(undefined, {createRuleForPage: true, pageId: this.pageId});
				window.close();
			},
			goToManagementPage: function(){
				chrome.runtime.sendMessage(undefined, {goToManagementPage: true});
				window.close();
			},
			initialize: async function(){
				var info = await initializedPromise;
				this.pageId = info.pageId;
				this.rules = info.rules;
			}
		},
		components: {
			rule: {
				template: document.getElementById("ruleTemplate").innerHTML,
				props: {
					rule: Object
				},
				computed: {
					editable: function(){
						return !!this.rule && this.rule.editable
					}
				},
				methods: {
					onExecuteClicked: function(){
						this.$emit('executeclicked', this.rule.ruleId);
					},
					onEditClicked: function(){
						this.$emit('editclicked', this.rule.ruleId);
					},
				}
			}
		}
	})
})();