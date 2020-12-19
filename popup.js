(function(){

	new Vue({
		el: '#app',
		data: function(){
			return {
				pageId: undefined,
				tabId: undefined,
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
				chrome.runtime.sendMessage(undefined, {initializePopup: true}, resp => {
					this.pageId = resp.pageId;
					this.tabId = resp.tabId;
					this.rules = resp.rules.map(r => {
						return {
							ruleId: r.ruleId,
							rule: r.rule,
							editable: r.editable,
							hasExecuted: resp.executionStates.some(s => s.ruleId === r.ruleId && s.hasExecuted),
							hasSomethingToDo: resp.executionStates.some(s => s.ruleId === r.ruleId && s.hasSomethingToDo)
						};
					});
				});
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
						return !this.executingrule && !!this.rule && this.rule.hasSomethingToDo;
					},
					hasExecuted: function(){
						return !!this.rule && this.rule.hasExecuted;
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