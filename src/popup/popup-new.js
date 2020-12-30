(function(){

	new Vue({
		el: '#app',
		data: function(){
			return {
				pageId: undefined,
				tabId: undefined,
				rules: []
			};
		},
		mounted: function(){
			this.initialize();
		},
		methods: {
			onExecuteClicked: function(rule){
				

			},
			onEditClicked: function(rule){

			},
			addRule: function(){

			},
			goToManagementPage: function(){

			},
			setExecutionStates: function(executionStates){
				for(let state of executionStates){
					const rule = this.rules.find(r => r.ruleId === state.ruleId);
					if(!rule){
						continue;
					}
					rule.hasExecuted = state.hasExecuted;
					rule.hasSomethingToDo = state.hasSomethingToDo;
				}
			},
			initialize: async function(){
				var pageId = await macros.getPageIdForPopup();
				this.rules = await macros.getRulesForPage(pageId);
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
						return true;
					},
					isExecuting: function(){
						return false;
					},
					canExecute: function(){
						return true;
					},
					hasExecuted: function(){
						return false;
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