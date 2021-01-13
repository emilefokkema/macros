(function(){

	new Vue({
		el: '#app',
		data: function(){
			return {
				navigations: [],
				selectedNavigation: undefined,
				ruleCurrentlyExecuting: undefined
			};
		},
		mounted: function(){
			this.initialize();
		},
		computed: {
			navigationIdOption: {
				get: function(){
					return this.selectedNavigation && this.selectedNavigation.navigationId;
				},
				set: function(value){
					var navigation = this.navigations.find(n => n.navigationId === value);
					if(navigation){
						this.selectedNavigation = navigation;
					}
				}
			}
		},
		methods: {
			onExecuteClicked: async function({rule, navigationId}){
				this.ruleCurrentlyExecuting = rule;
				await macros.executeRuleAsync(navigationId, rule.id);
				this.ruleCurrentlyExecuting = undefined;
			},
			onEditClicked: function(rule){

			},
			goToManagementPage: function(){

			},
			addNavigation(navigation){
				navigation.origin = new URL(navigation.url).origin;
				var existingIndex = this.navigations.findIndex(n => n.navigationId === navigation.navigationId);
				if(existingIndex > -1){
					if(!!this.selectedNavigation && this.selectedNavigation.navigationId === navigation.navigationId){
						this.selectedNavigation = navigation;
					}
					this.navigations.splice(existingIndex, 1, navigation)
				}else{
					this.navigations.push(navigation);
					if(!this.selectedNavigation || navigation.rules.length > 0 && this.selectedNavigation.rules.length === 0){
						this.selectedNavigation = navigation;
					}
				}
			},
			addRule(){

			},
			initialize: function(){
				macros.onNotifyRulesForNavigation(navigation => {
					this.addNavigation(navigation);
				});
				macros.notifyPopupOpened();
			}
		},
		components: {
			navigation: {
				template: document.getElementById("navigationTemplate").innerHTML,
				props: {
					navigation: Object,
					rulecurrentlyexecuting: Object
				},
				methods:{
					onEditClicked(rule){

					},
					onExecuteClicked(rule){
						this.$emit('executeclicked', {rule, navigationId: this.navigation.navigationId});
					}
				},
				components: {
					rule: {
						template: document.getElementById("ruleTemplate").innerHTML,
						props: {
							rule: Object,
							rulecurrentlyexecuting: Object
						},
						computed: {
							editable: function(){
								return true;
							},
							isExecuting: function(){
								return this.rulecurrentlyexecuting === this.rule;
							},
							canExecute: function(){
								return this.rule.hasSomethingToDo;
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
			},
			
		}
	})
})();