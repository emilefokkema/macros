import { macros } from '../sandbox/macros';
import { Event, CancellationToken } from '../shared/events';

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

class DragManager{
	constructor(){
		this.currentlyDragging = undefined;
	}
	startDragging(navigationId, suggestionId){
		console.log(`starting dragging navigation ${navigationId}, suggestion ${suggestionId}`)
		this.currentlyDragging = {navigationId, suggestionId};
	}
	stopDragging(){
		console.log(`stopping dragging`)
		const currentlyDragging = this.currentlyDragging;
		this.currentlyDragging = undefined;
		return currentlyDragging;
	}
}

Vue.component('rule-view', {
	template: document.getElementById('ruleViewTemplate').innerHTML,
	data(){
		return {
			isDraggedOver: false
		};
	},
	props: {
		name: String,
		canExecute: Boolean,
		isExecuting: Boolean,
		hasExecuted: Boolean,
		editable: Boolean,
		isDraft: Boolean,
		shareable: Boolean,
		message: String
	},
	methods: {
		onExecuteClicked(){
			this.$emit('execute-clicked');
		},
		onEditClicked(){
			this.$emit('edit-clicked');
		},
		onDragEnter(){
			this.isDraggedOver = true;
		},
		onDragLeave(){
			this.isDraggedOver = false;
		},
		onDragOver(dragEvent){
			if(!this.editable){
				return;
			}
			this.isDraggedOver = true;
			dragEvent.preventDefault();
			dragEvent.dataTransfer.dropEffect = "move";
		},
		onDrop(dragEvent){
			dragEvent.preventDefault();
			this.$emit('suggestion-dropped');
			this.isDraggedOver = false;
		},
		onShareClicked(){
			this.$emit('share-clicked');
		}
	}
});

Vue.component('new-rule', {
	template: document.getElementById('newRuleTemplate').innerHTML,
	props: {
		navigationId: String
	},
	inject: ['dragManager'],
	methods: {
		onDrop(){
			const {suggestionId} = this.dragManager.stopDragging();
			macros.requestToAddSuggestionToNewRule(this.navigationId, suggestionId);
		}
	}
});

new Vue({
	el: '#app',
	data: function(){
		return {
			navigations: [],
			loading: true,
			loadedRules: false,
			_selectedNavigationId: undefined,
			suggestionIsBeingDragged: false,
			suggestionsPresent: false
		};
	},
	mounted: function(){
		this.initialize();
	},
	provide: {
		executionManager: new ExecutionManager(),
		dragManager: new DragManager()
	},
	computed: {
		hasNavigations(){
			return this.navigations.length > 0;
		},
		selectedNavigationId: {
			get(){
				return this.$data._selectedNavigationId;
			},
			set(value){
				this.loadedRules = false;
				this.$data._selectedNavigationId = value;
			}
		}
	},
	methods: {
		addRule(){
			macros.requestToOpenEditor({navigationId: this.$data._selectedNavigationId});
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
		onSuggestionDragStart(){
			this.suggestionIsBeingDragged = true;
		},
		onSuggestionDragEnd(){
			this.suggestionIsBeingDragged = false;
		},
		onSuggestionsPresent(suggestionsPresent){
			this.suggestionsPresent = suggestionsPresent;
		},
		onFinishLoadingRules(){
			this.loadedRules = true;
		},
		initialize: async function(){
			const navigations = await macros.navigation.getNavigationsForPopup();
			const topNavigation = navigations.find(n => n.top);
			this.$data._selectedNavigationId = topNavigation && topNavigation.id;
			this.navigations = (topNavigation ? [topNavigation] : []).concat(navigations.filter(n => !n.top));
			this.loading = false;
		}
	},
	components: {
		'rule-list': {
			template: document.getElementById('ruleListTemplate').innerHTML,
			props: {
				navigationId: String,
				dragIsHappening: Boolean,
				suggestionsPresent: Boolean
			},
			data: function(){
				return {
					loading: true,
					rules: [],
					draftRule: undefined
				};
			},
			mounted: function(){
				this.load();
			},
			methods: {
				async load(){
					this.loading = true;
					const rules = await macros.getRuleStatesForNavigation(this.navigationId);
					const draftRule = await macros.getDraftRuleStateForNavigation(this.navigationId);
					macros.onDraftRuleStateForNavigation(({navigationId, draftRuleState}) => {
						if(navigationId !== this.navigationId){
							return;
						}
						this.draftRule = draftRuleState;
					});
					this.loading = false;
					this.rules = rules;
					this.draftRule = draftRule;
					this.$emit('load-finish');
				},
				onRuleReplaced(newRule){
					const index = this.rules.findIndex(r => r.id === newRule.id);
					if(index === -1){
						return;
					}
					this.rules.splice(index, 1, newRule);
				}
			},
			computed: {
				empty(){
					return !this.loading && this.rules.length === 0;
				}
			},
			watch: {
				navigationId(){
					this.load();
				}
			},
			components: {
				rule: {
					template: document.getElementById("ruleTemplate").innerHTML,
					props: {
						rule: Object,
						navigationId: String
					},
					data: function(){
						return {
							currentExecutionId: undefined,
							ownCurrentExecutionId: undefined,
							hasExecuted: false,
							cancellationToken: new CancellationToken(),
							temporaryMessage: undefined
						};
					},
					watch: {
						rule(rule){
							this.hasExecuted = rule.hasExecuted;
						}
					},
					inject: ['executionManager', 'dragManager'],
					computed: {
						isExecuting: function(){
							return this.currentExecutionId !== undefined && this.currentExecutionId === this.ownCurrentExecutionId;
						},
						canExecute: function(){
							return this.rule.hasSomethingToDo && this.currentExecutionId === undefined;
						},
						editable(){
							return this.rule.editable;
						}
					},
					mounted: function(){
						this.hasExecuted = this.rule.hasExecuted;
						this.executionManager.currentExecutionIdChanged.listen((id) => {
							this.currentExecutionId = id;
						});
						macros.onRuleStateForNavigationChanged(({navigationId, state: rule}) => {
							if(navigationId !== this.navigationId || rule.id !== this.rule.id){
								return;
							}
							this.$emit('replaced', rule)
						}, this.cancellationToken);
					},
					beforeUnmount: function(){
						this.cancellationToken.cancel();
					},
					methods: {
						onExecuteClicked: async function(){
							this.ownCurrentExecutionId = this.executionManager.startExecution();
							await macros.executeRuleAsync(this.navigationId, this.rule.id);
							this.executionManager.stopExecution();
							this.hasExecuted = true;
							this.ownCurrentExecutionId = undefined;
						},
						onEditClicked: function(){
							macros.requestToOpenEditor({ruleId: this.rule.id, navigationId: this.navigationId});
						},
						onDrop(){
							const {suggestionId} = this.dragManager.stopDragging();
							macros.requestToAddSuggestionToRule(this.rule.id, this.navigationId, suggestionId);
						},
						async onShareClicked(){
							const url = await macros.getUrlWithEncodedRule(this.rule.id, this.navigationId);
							await macros.page.copyToClipboard(url);
							this.setTemporaryMessage('copied to clipboard');
						},
						setTemporaryMessage(msg){
							this.temporaryMessage = msg;
							setTimeout(() => {
								this.temporaryMessage = undefined;
							}, 2000);
						}
					}
				},
				'draft-rule': {
					template: document.getElementById('draftRuleTemplate').innerHTML,
					props: {
						draftRule: Object,
						navigationId: String
					},
					data(){
						return {
							currentExecutionId: undefined,
							ownCurrentExecutionId: undefined,
							hasExecuted: false,
							cancellationToken: new CancellationToken()
						}
					},
					watch: {
						draftRule(rule){
							this.hasExecuted = rule.hasExecuted;
						}
					},
					inject: ['executionManager', 'dragManager'],
					computed: {
						isExecuting: function(){
							return this.currentExecutionId !== undefined && this.currentExecutionId === this.ownCurrentExecutionId;
						},
						canExecute: function(){
							return this.draftRule.hasSomethingToDo && this.currentExecutionId === undefined;
						},
						editable(){
							return this.draftRule.editable;
						}
					},
					mounted(){
						this.hasExecuted = this.draftRule.hasExecuted;
						this.executionManager.currentExecutionIdChanged.listen((id) => {
							this.currentExecutionId = id;
						});
					},
					methods: {
						async onExecuteClicked(){
							this.ownCurrentExecutionId = this.executionManager.startExecution();
							await macros.executeDraftRule(this.navigationId);
							this.executionManager.stopExecution();
							this.hasExecuted = true;
							this.ownCurrentExecutionId = undefined;
						},
						onEditClicked(){
							macros.requestToOpenEditor({navigationId: this.navigationId});
						},
						onDrop(){
							const {suggestionId} = this.dragManager.stopDragging();
							macros.requestToAddSuggestionToNewRule(this.navigationId, suggestionId);
						}
					}
				},
				'no-rules': {
					template: document.getElementById('noRulesTemplate').innerHTML,
					data(){
						return {
							isDraggedOver: false
						};
					},
					props: {
						suggestionsPresent: Boolean,
						navigationId: String
					},
					inject: ['dragManager'],
					methods: {
						onDragEnter(){
							this.isDraggedOver = true;
						},
						onDragLeave(){
							this.isDraggedOver = false;
						},
						onDragOver(dragEvent){
							this.isDraggedOver = true;
							dragEvent.preventDefault();
							dragEvent.dataTransfer.dropEffect = "move";
						},
						onDrop(){
							const {suggestionId} = this.dragManager.stopDragging();
							macros.requestToAddSuggestionToNewRule(this.navigationId, suggestionId);
						}
					},
					computed: {
						message(){
							return this.suggestionsPresent ? 'No rules yet. Drag a suggestion to get started.' : 'No rules yet.';
						}
					}
				}
			}
		},
		'suggestion-list': {
			template: document.getElementById('suggestionListTemplate').innerHTML,
			props: {
				navigationId: String
			},
			data: function(){
				return {
					loading: true,
					suggestions: []
				};
			},
			mounted: function(){
				this.load();
			},
			watch: {
				navigationId(){
					this.load();
				}
			},
			methods: {
				async load(){
					this.loading = true;
					const suggestions = await macros.getSuggestions(this.navigationId);
					this.loading = false;
					this.suggestions = suggestions;
					this.$emit('suggestions-present', suggestions.length > 0);
				},
				async onReloadClicked(){
					this.suggestions = [];
					this.loading = true;
					const suggestions = await macros.reloadSuggestions(this.navigationId);
					this.loading = false;
					this.suggestions = suggestions;
					this.$emit('suggestions-present', suggestions.length > 0);
				},
				onSuggestionRemoved(id){
					const index = this.suggestions.findIndex(s => s.id === id);
					if(index === -1){
						return;
					}
					this.suggestions.splice(index, 1);
				},
				onSuggestionDragStart(){
					this.$emit('suggestion-drag-start');
				},
				onSuggestionDragEnd(){
					this.$emit('suggestion-drag-end');
				}
			},
			components: {
				suggestion: {
					template: document.getElementById("suggestionTemplate").innerHTML,
					props: {
						suggestion: Object,
						navigationId: String
					},
					data: function(){
						return {
							currentExecutionId: undefined,
							ownCurrentExecutionId: undefined,
							hasExecuted: false,
							isBeingDragged: false,
							mouseIsOverOuter: false
						};
					},
					inject: ['executionManager', 'dragManager'],
					mounted: function(){
						this.hasExecuted = this.suggestion.hasExecuted;
						this.executionManager.currentExecutionIdChanged.listen((id) => {
							this.currentExecutionId = id;
						});
					},
					computed: {
						canExecute(){
							return this.currentExecutionId === undefined;
						},
						isExecuting(){
							return this.currentExecutionId !== undefined && this.currentExecutionId === this.ownCurrentExecutionId;
						}
					},
					methods: {
						async onRemoveClicked(){
							await macros.markSuggestionAsRemoved(this.navigationId, this.suggestion.id);
							this.$emit('removed', this.suggestion.id);
						},
						onMouseOverOuter(){
							this.mouseIsOverOuter = true;
						},
						onMouseLeaveOuter(){
							this.mouseIsOverOuter = false;
						},
						onMouseEnter(){
							if(this.isBeingDragged){
								return;
							}
							macros.notifySuggestionIndicationStart(this.navigationId, this.suggestion.id);
						},
						onMouseLeave(){
							macros.notifySuggestionIndicationEnd(this.navigationId, this.suggestion.id);
						},
						startDragging(){
							this.isBeingDragged = true;
							macros.notifySuggestionIndicationEnd(this.navigationId, this.suggestion.id);
							this.dragManager.startDragging(this.navigationId, this.suggestion.id);
							setTimeout(() => this.$emit('suggestion-drag-start'), 0)
						},
						stopDragging(ev){
							console.log('stop dragging', ev)
							this.isBeingDragged = false;
							if(ev.dataTransfer.dropEffect === 'move'){
								this.$emit('removed', this.suggestion.id);
							}else{
								this.dragManager.stopDragging();
							}
							this.$emit('suggestion-drag-end');
						},
						async onExecuteClicked(){
							this.ownCurrentExecutionId = this.executionManager.startExecution();
							await macros.executeSuggestion(this.navigationId, this.suggestion.id);
							this.executionManager.stopExecution();
							this.ownCurrentExecutionId = undefined;
							this.hasExecuted = true;
						},
						async onUndoClicked(){
							this.ownCurrentExecutionId = this.executionManager.startExecution();
							await macros.undoSuggestion(this.navigationId, this.suggestion.id);
							this.executionManager.stopExecution();
							this.ownCurrentExecutionId = undefined;
							this.hasExecuted = false;
						}
					}
				}
			}
		}
	}
})