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
				console.log(`adding new navigation with id ${notification.navigationId}`)
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
		}
	})
})()