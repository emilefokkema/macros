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
				rules: [],
				executingRule: undefined
			};
		},
		mounted: function(){
			this.initialize();
		},
		methods: {
			onExecuteClicked: function(rule){
				this.executingRule = rule;
				chrome.runtime.sendMessage(undefined, {executeRule: true, pageId: this.pageId, ruleId: rule.ruleId}, resp => {
					this.executingRule = undefined;
				});
			},
			onEditClicked: function(rule){
				chrome.runtime.sendMessage(undefined, {editRule: true, pageId: this.pageId, ruleId: rule.ruleId});
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
					rule: Object,
					executingrule: Object
				},
				computed: {
					editable: function(){
						return !!this.rule && this.rule.editable
					},
					isExecuting: function(){
						return !!this.executingrule && this.executingrule === this.rule;
					},
					canExecute: function(){
						return !this.executingrule;
					},
					otherIsExecuting: function(){
						return !!this.executingrule && this.executingrule !== this.rule;
					}
				},
				methods: {
					onExecuteClicked: function(){
						this.$emit('executeclicked');
					},
					onEditClicked: function(){
						this.$emit('editclicked');
					},
				}
			}
		}
	})
})();