(function(){

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
				await this.refresh();
				macros.onRuleAdded(() => this.refresh());
				macros.onRuleUpdated(() => this.refresh());
			},
			refresh: async function(){
				this.rules = await macros.getAllRules();
			},
			onDeleteRuleClicked: async function(rule){
				if(confirm(`Are you sure you want to delete '${rule.name}'?`)){
					await macros.deleteRuleAsync(rule.id);
					this.refresh();
				}
			}
		},
		components: {
			rule: {
				template: document.getElementById("ruleTemplate").innerHTML,
				props: {
					rule: Object
				},
				data: function(){
					return {
						deletable: true
					};
				},
				mounted: function(){
					this.initialize();
				},
				methods: {
					async initialize(){
						var editedStatus = await macros.getEditedStatusAsync(this.rule.id);
						this.deletable = !editedStatus.edited;
						macros.onEditedStatusChanged(({ruleId, edited}) => {
							if(ruleId !== this.rule.id){
								return;
							}
							this.deletable = !edited;
						});
					},
					onDeleteClicked: function(){
						this.$emit('deleteruleclicked')
					},
					onEditClicked: function(){
						macros.requestToOpenEditor({ruleId: this.rule.id});
					}
				}
			}
		}
	})
})()