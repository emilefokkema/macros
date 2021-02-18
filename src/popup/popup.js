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
			onEditClicked: function({rule, navigationId}){
				macros.requestToOpenEditor({ruleId: rule.id, navigationId});
			},
			addRule(){
				macros.requestToOpenEditor({navigationId: this.selectedNavigation.navigationId});
			},
			goToManagementPage: function(){
				macros.openManagementPage();
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
			initialize: async function(){
				var tabId = await macros.navigation.getPopupTabId();
				macros.onNotifyRulesForNavigation(navigation => {
					if(navigation.tabId !== tabId){
						return;
					}
					this.addNavigation(navigation);
				});
				macros.requestToEmitRules({tabId});
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
						this.$emit('editclicked', {rule, navigationId: this.navigation.navigationId});
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
							rulecurrentlyexecuting: Object,
							navigationid: String
						},
						data: function(){
							return {
								editable: false
							};
						},
						computed: {
							isExecuting: function(){
								return this.rulecurrentlyexecuting === this.rule;
							},
							canExecute: function(){
								return this.rule.hasSomethingToDo && !this.rulecurrentlyexecuting;
							},
							hasExecuted: function(){
								return this.rule.hasExecuted;
							}
						},
						mounted: async function(){
							var editedStatus = await macros.getEditedStatusAsync(this.rule.id);
							this.editable = !editedStatus.edited || editedStatus.navigationId === this.navigationid;
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