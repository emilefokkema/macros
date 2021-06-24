import { macros } from '../sandbox/macros';
import { Event } from '../shared/events';

class ExecutionManager{
	constructor(){
		this.currentExecutionIdChanged = new Event();
		this.newExecutionId = 0;
		this.currentExecutionId = undefined;
	}
	startExecution(){
		const executionId = this.newExecutionId++;
		setTimeout(() => {
			this.currentExecutionId = executionId;
			this.currentExecutionIdChanged.dispatch(executionId);
		}, 0);
		return executionId;
	}
	stopExecution(){
		this.currentExecutionId = undefined;
		this.currentExecutionIdChanged.dispatch(undefined);
	}
}

new Vue({
	el: '#app',
	data: function(){
		return {
			navigations: [],
			selectedNavigation: undefined
		};
	},
	mounted: function(){
		this.initialize();
	},
	provide: {
		executionManager: new ExecutionManager()
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
					console.log(`selectedNavigation was changed to a new value`)
				}
			}
		}
	},
	methods: {
		// onExecuteClicked: async function({rule, navigationId}){
		// 	this.ruleCurrentlyExecuting = rule;
		// 	await macros.executeRuleAsync(navigationId, rule.id);
		// 	this.ruleCurrentlyExecuting = undefined;
		// },
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
				navigation: Object
			},
			methods:{
				onEditClicked(rule){
					this.$emit('editclicked', {rule, navigationId: this.navigation.navigationId});
				}
			},
			components: {
				rule: {
					template: document.getElementById("ruleTemplate").innerHTML,
					props: {
						rule: Object,
						navigationid: String
					},
					data: function(){
						return {
							editable: false,
							currentExecutionId: undefined,
							ownCurrentExecutionId: undefined
						};
					},
					inject: ['executionManager'],
					computed: {
						isExecuting: function(){
							return this.currentExecutionId !== undefined && this.currentExecutionId === this.ownCurrentExecutionId;
						},
						canExecute: function(){
							return this.rule.hasSomethingToDo && this.currentExecutionId === undefined;
						},
						hasExecuted: function(){
							return this.rule.hasExecuted;
						}
					},
					mounted: async function(){
						this.executionManager.currentExecutionIdChanged.listen((id) => {
							this.currentExecutionId = id;
						});
						var editedStatus = await macros.getEditedStatusAsync(this.rule.id);
						this.editable = !editedStatus.edited || editedStatus.navigationId === this.navigationid;
					},
					methods: {
						onExecuteClicked: async function(){
							this.ownCurrentExecutionId = this.executionManager.startExecution();
							await macros.executeRuleAsync(this.navigationid, this.rule.id);
							this.executionManager.stopExecution();
							this.ownCurrentExecutionId = undefined;
						},
						onEditClicked: function(){
							this.$emit('editclicked');
						},
					}
				},
				suggestion: {
					template: document.getElementById("suggestionTemplate").innerHTML,
					props: {
						suggestion: Object,
						navigationid: String
					},
					data: function(){
						return {
							currentExecutionId: undefined,
							ownCurrentExecutionId: undefined,
							hasExecutedNow: false
						};
					},
					inject: ['executionManager'],
					mounted: function(){
						this.executionManager.currentExecutionIdChanged.listen((id) => {
							this.currentExecutionId = id;
						});
					},
					computed: {
						canExecute(){
							return !this.suggestion.hasExecuted && !this.hasExecutedNow && this.currentExecutionId === undefined;
						},
						isExecuting(){
							return this.currentExecutionId !== undefined && this.currentExecutionId === this.ownCurrentExecutionId;
						},
						hasExecuted(){
							return this.suggestion.hasExecuted || this.hasExecutedNow;
						}
					},
					methods: {
						onMouseEnter(){
							macros.notifySuggestionIndicationStart(this.navigationid, this.suggestion.suggestionId);
						},
						onMouseLeave(){
							macros.notifySuggestionIndicationEnd(this.navigationid, this.suggestion.suggestionId);
						},
						async onExecuteClicked(){
							this.ownCurrentExecutionId = this.executionManager.startExecution();
							await macros.executeSuggestion(this.navigationid, this.suggestion.suggestionId);
							this.executionManager.stopExecution();
							this.ownCurrentExecutionId = undefined;
							this.hasExecutedNow = true;
						}
					}
				}
			}
		},
		
	}
})