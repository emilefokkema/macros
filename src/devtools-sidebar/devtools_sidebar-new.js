(function(){
	
	new Vue({
		el: "#app",
		data: function(){
			return {
				navigations: [],
				selectedNavigation: undefined
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
			removeNavigation(navigationId){
				console.log(`removing navigation id ${navigationId}`)
				var index = this.navigations.findIndex(n => n.navigationId === navigationId);
				if(index === -1){
					return;
				}
				var [removed] = this.navigations.splice(index, 1);
				if(this.selectedNavigation === removed){
					this.selectedNavigation = undefined;
				}
			},
			replaceNavigationAtIndex(navigation, index){
				navigation.origin = new URL(navigation.url).origin;
				var [removed] = this.navigations.splice(index, 1, navigation);
				if(removed === this.selectedNavigation){
					this.selectedNavigation = navigation;
				}
			},
			async addNavigation(notification){
				var existingIndex = this.navigations.findIndex(n => n.navigationId === notification.navigationId);
				if(existingIndex > -1){
					console.log(`replacing navigation with id ${notification.navigationId}`)
					this.replaceNavigationAtIndex(notification, existingIndex);
					return;
				}
				console.log(`adding new navigation with id ${notification.navigationId}:`, notification)
				var navigation = await macros.navigation.getNavigation(notification.navigationId);
				if(!navigation){
					return;
				}
				notification.origin = new URL(notification.url).origin;
				this.navigations.push(notification);
				navigation.disappeared.next().then(() => this.removeNavigation(notification.navigationId));
				if(!this.selectedNavigation){
					this.selectedNavigation = notification;
				}
			},
			initialize: async function(){
				var tabId = macros.inspectedWindow.tabId;
				macros.onNotifyRulesForNavigation(notification => {
					if(notification.tabId !== tabId){
						return;
					}
					this.addNavigation(notification);
				});
				macros.navigation.onReplaced(({navigationHistoryId, newNavigationId}) => {console.log(`replacement for ${navigationHistoryId}: ${newNavigationId}`)})
				macros.requestToEmitRules({tabId});
			}
		},
		components: {
			navigation: {
				template: document.getElementById('navigationTemplate').innerHTML,
				props: {
					navigation: Object
				},
				data: function(){
					return {
						rulesAndEffects: []
					};
				},
				mounted: function(){
					this.setRulesAndEffects();
				},
				watch: {
					navigation: function(){
						this.setRulesAndEffects();
					}
				},
				methods: {
					setRulesAndEffects(){
						if(this.navigation.selectedElement){
							this.rulesAndEffects = this.navigation.rules.map(rule => ({
								rule,
								effects: this.navigation.selectedElement.effect.find(e => e.ruleId === rule.id).effect
							}))
						}
					}
				},
				components: {
					selector: {
						template: document.getElementById('selectorTemplate').innerHTML,
						props: {
							selector: Object
						}
					},
					rule: {
						template: document.getElementById('ruleTemplate').innerHTML,
						props: {
							rule: Object,
							effects: Array,
							navigationid: String
						},
						data: function(){
							return {
								editable: false
							};
						},
						mounted: function(){
							this.initialize();
						},
						methods: {
							async initialize(){
								var editedStatus = await macros.getEditedStatusAsync(this.rule.id);
								this.editable = !editedStatus.edited || editedStatus.navigationId === this.navigationid;
								macros.onEditedStatusChanged(({ruleId, edited, otherNavigationId}) => {
									if(ruleId !== this.rule.id){
										return;
									}
									this.editable = !edited || otherNavigationId === this.navigationid;
								});
							},
							onAddActionClicked(){

							}
						}
					}
				}
			}
		}
	})
})()