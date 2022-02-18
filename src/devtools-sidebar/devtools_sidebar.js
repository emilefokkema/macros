(function(){
	Vue.component('rule-view', {
		template: document.getElementById('ruleViewTemplate').innerHTML,
		props: {
			name: String,
			effects: Array,
			editable: Boolean,
			isDraft: Boolean
		},
		methods: {
			onAddActionClicked(){
				this.$emit('add-action-clicked');
			}
		}
	});
	new Vue({
		el: "#app",
		data: function(){
			let tabId;
			const url = new URL(location.href);
			const tabIdString = url.searchParams.get('tabId');
			if(tabIdString){
				tabId = parseInt(tabIdString);
			}
			return {
				navigations: [],
				selectedNavigation: undefined,
				loading: true,
				selectedElement: undefined,
				tabId,
				nonHtmlElementSelected: false
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
			},
			nodeOtherThanHtmlElementSelected(){
				return this.selectedElement && !this.selectedElement.isHtmlElement;
			}
		},
		methods: {
			initialize: async function(){
				this.selectedElement = await macros.getSelectedElementInDevtools(this.tabId);
				macros.onSelectedElementInDevtoolsChange((selectedElement) => {
					if(selectedElement.tabId !== this.tabId){
						return;
					}
					this.selectedElement = selectedElement;
				});
				this.loading = false;
			}
		},
		components: {
			selector: {
				template: document.getElementById('selectorTemplate').innerHTML,
				props: {
					selector: Object
				}
			},
			'rule-list': {
				template: document.getElementById('ruleListTemplate').innerHTML,
				props: {
					navigationId: String,
					selectorText: String
				},
				data(){
					return {
						rules: [],
						draftRule: undefined,
						loading: true
					};
				},
				watch: {
					navigationId(){
						this.load();
					}
				},
				mounted(){
					macros.onDraftRuleStateForNavigation(({navigationId, draftRuleState}) => {
						if(navigationId !== this.navigationId){
							return;
						}
						this.draftRule = draftRuleState;
					});
					macros.onRuleStateForNavigationChanged(({navigationId, state: rule}) => {
						if(navigationId !== this.navigationId){
							return;
						}
						const index = this.rules.findIndex(r => r.id === rule.id);
						if(index === -1){
							this.rules.push(rule);
						}else{
							this.rules.splice(index, 1, rule);
						}
					});
					macros.onRuleStateForNavigationRemoved(({navigationId, ruleId}) => {
						if(navigationId !== this.navigationId){
							return;
						}
						const index = this.rules.findIndex(r => r.id === ruleId);
						if(index === -1){
							return;
						}
						this.rules.splice(index, 1);
					});
					this.load();
				},
				methods: {
					async load(){
						this.loading = true;
						const rules = await macros.getRuleStatesForNavigation(this.navigationId);
						const draftRule = await macros.getDraftRuleStateForNavigation(this.navigationId);
						this.rules = rules;
						this.draftRule = draftRule;
						this.loading = false;
					}
				},
				components: {
					rule: {
						template: document.getElementById('ruleTemplate').innerHTML,
						props: {
							rule: Object,
							navigationId: String,
							selectorText: String
						},
						methods: {
							onAddActionClicked(){
								macros.addSelectAction(this.navigationId, this.selectorText, this.rule.id);
							}
						}
					},
					'draft-rule': {
						template: document.getElementById('draftRuleTemplate').innerHTML,
						props: {
							rule: Object,
							navigationId: String,
							selectorText: String
						},
						methods: {
							onAddActionClicked(){
								macros.addSelectAction(this.navigationId, this.selectorText);
							}
						}
					},
					'new-rule': {
						template: document.getElementById('newRuleTemplate').innerHTML,
						props: {
							navigationId: String,
							selectorText: String
						},
						methods: {
							onAddActionClicked(){
								macros.addSelectAction(this.navigationId, this.selectorText);
							}
						}
					}
				}
			}
		}
	})
})()