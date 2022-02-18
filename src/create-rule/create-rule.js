import { macros } from '../sandbox/macros';
import { debounce } from '../shared/debounce';
import { RuleForm } from './rule-form';

const notifyDraftRuleChanged = debounce((navigationId, draftRule) => macros.notifyDraftRuleChanged(navigationId, draftRule), 300);
new Vue({
	el: '#app',
	data: function(){
		return {
			ruleId: undefined,
			executingActionId: undefined,
			isNew: true,
			isDirty: true,
			hasPage: false,
			url: undefined,
			otherNavigationId: undefined,
			showErrors: false,
			form: new RuleForm()
		};
	},
	mounted: function(){
		this.initialize();
	},
	computed: {
		hasNameRequiredError(){
			return this.form.errors && !!this.form.errors['nameRequired'];
		},
		hasUrlPatternRequiredError(){
			return this.form.errors && !!this.form.errors['urlPatternRequired'];
		},
		saveDisabled(){
			return this.showErrors && !this.form.valid;
		}
	},
	methods: {
		async onValueChanged(){
			this.isDirty = true;
			macros.page.setUnsavedChangedWarningEnabled(true);
			if(this.isNew && this.form.valid){
				notifyDraftRuleChanged(this.otherNavigationId, this.getRule());
			}
		},
		onAddType: function(type){
			this.form.addActionOfType(type);
		},
		async removePage(){
			if(this.isNew){
				macros.page.setUnsavedChangedWarningEnabled(false);
				macros.page.close();
				return;
			}
			this.hasPage = false;
			var currentLocation = macros.page.getLocation();
			var newUrl = macros.editors.replaceParamsInHref(currentLocation, undefined, this.ruleId);
			await macros.page.pushHistoryState(newUrl);
			macros.notifyEditorLoaded({ruleId: this.ruleId});
		},
		initialize: async function(){
			this.form.valueChanged.listen(() => {
				this.onValueChanged();
			});
			var currentLocation = macros.page.getLocation();
			var {ruleId, navigationId: otherNavigationId} = macros.editors.getParamsFromHref(currentLocation);
			let otherNavigation;
			if(otherNavigationId){
				otherNavigation = await macros.navigation.getNavigation(otherNavigationId);
				if(otherNavigation){
					this.hasPage = true;
					this.otherNavigationId = otherNavigationId;
					this.url = otherNavigation.url;
					macros.navigation.whenDisappeared(otherNavigationId).then(() => this.removePage());
				}
			}
			if(ruleId){
				this.ruleId = ruleId;
				this.isNew = false;
				this.isDirty = false;
				var rule = await macros.getRuleById(ruleId);
				this.setRule(rule);
				this.subscribeToChangesInRule();
			}else if(otherNavigationId){
				if(otherNavigation){
					const newRule = await macros.createNewDraftRuleForNavigation(otherNavigationId);
					this.setNewRule(newRule);
				}
			}
			macros.onRequestToAddAction(({ruleId, navigationId, actionDefinition}) => {
				if(this.ruleId !== undefined && ruleId === this.ruleId || this.otherNavigationId !== undefined && navigationId === this.otherNavigationId){
					this.form.addAction(actionDefinition);
				}
			});
			macros.onRequestToAddSelectActionToEditor(({navigationId, ruleId, selectorText}) => {
				if(this.ruleId !== undefined && ruleId === this.ruleId || this.otherNavigationId !== undefined && navigationId === this.otherNavigationId){
					this.form.addSelectAction(selectorText);
				}
			});
			macros.notifyEditorLoaded({ruleId, otherNavigationId});
		},
		subscribeToChangesInRule(){
			macros.onRuleUpdated(async ({ruleId}) => {
				if(ruleId === this.ruleId){
					const rule = await macros.getRuleById(ruleId);
					this.setRule(rule);
				}
			});
		},
		setRule: function(rule){
			this.form.setRule(rule);
			this.setTitle();
		},
		setNewRule(newRule){
			this.form.setRule(newRule);
		},
		getRule(){
			return this.form.getRule();
		},
		saveRule: async function(){
			this.showErrors = true;
			if(!this.form.valid){
				return;
			}
			var rule = this.getRule();
			var ruleId = await macros.saveRuleAsync(rule);
			this.isDirty = false;
			macros.page.setUnsavedChangedWarningEnabled(false);
			this.showErrors = false;
			if(this.isNew){
				this.isNew = false;
				this.ruleId = ruleId;
				this.setTitle();
				var currentUrl = macros.page.getLocation();
				var newUrl = macros.editors.replaceParamsInHref(currentUrl, this.otherNavigationId, this.ruleId);
				await macros.page.pushHistoryState(newUrl);
				macros.notifyEditorLoaded({ruleId: this.ruleId, otherNavigationId: this.otherNavigationId});
				this.subscribeToChangesInRule();
			}
		},
		setTitle: function(){
			macros.page.setTitle(`Edit '${this.form.name}'`);
		},
		gotoPage: async function(){
			var otherNavigation = await macros.navigation.getNavigation(this.otherNavigationId);
			if(otherNavigation){
				otherNavigation.focus();
			}
		},
		deleteActionById(id){
			this.form.deleteActionById(id);
		},
		async executeActionById(id){
			this.executingActionId = id;
			const action = this.form.getActionById(id);
			await macros.executeActionAsync(this.otherNavigationId, action);
			this.executingActionId = undefined;
		}
	},
	components: {
		'action-adder': {
			template: document.getElementById("actionAdderTemplate").innerHTML,
			data: function(){
				return {
					actionTypeConstants: {
						SELECT_ACTION_TYPE: macros.ruleDefinitions.SELECT_ACTION_TYPE
					},
					type: macros.ruleDefinitions.SELECT_ACTION_TYPE
				};
			},
			methods: {
				onAddClicked: function(){
					this.$emit('addtype', this.type);
				}
			}
		},
		action: {
			template: document.getElementById("actionTemplate").innerHTML,
			props: {
				form: Object,
				runnable: Boolean,
				executingActionId: Number,
				showErrors: Boolean
			},
			data: function(){
				return {
					actionTypeConstants: {
						SELECT_ACTION_TYPE: macros.ruleDefinitions.SELECT_ACTION_TYPE
					}
				};
			},
			methods: {
				execute(){
					this.$emit('execute-clicked');
				},
				deleteClicked(){
					this.$emit('delete-clicked');
				}
			},
			computed: {
				canExecute: function(){
					return this.runnable && this.executingActionId === undefined && this.form.valid;
				},
				isExecuting: function(){
					return this.executingActionId === this.form.id;
				},
				otherIsExecuting: function(){
					return this.executingActionId !== undefined && this.executingActionId !== this.form.id;
				}
			},
			components: {
				'select-action': {
					template: document.getElementById("selectActionTemplate").innerHTML,
					props: {
						form: Object,
						showErrors: Boolean
					},
					data: function(){
						return {
							actionTypeConstants: {
								DELETE_ACTION_TYPE: macros.ruleDefinitions.DELETE_ACTION_TYPE,
								REMOVE_CLASS_ACTION_TYPE: macros.ruleDefinitions.REMOVE_CLASS_ACTION_TYPE,
								REMOVE_STYLE_PROPERTY_ACTION_TYPE: macros.ruleDefinitions.REMOVE_STYLE_PROPERTY_ACTION_TYPE,
							}
						};
					},
					computed: {
						actionType: {
							get(){
								return !!this.form.actionForm && this.form.actionForm.type;
							},
							set(value){
								this.form.setActionOfType(value);
							}
						},
						hasSelectorRequiredError(){
							return this.form.errors && !!this.form.errors['selectorRequired'];
						},
						hasSelectorInvalidError(){
							return this.form.errors && !!this.form.errors['selectorInvalid'];
						},
						hasActionRequiredError(){
							return this.form.errors && !!this.form.errors['actionRequired'];
						},
					},
					components: {
						'remove-class-action': {
							template: document.getElementById("removeClassActionTemplate").innerHTML,
							props: {
								form: Object
							}
						},
						'remove-style-property-action': {
							template: document.getElementById("removeStylePropertyActionTemplate").innerHTML,
							props: {
								form: Object
							}
						}
					}
				}
			}
		}
	}
});