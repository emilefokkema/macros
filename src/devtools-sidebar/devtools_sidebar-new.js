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
				var index = this.navigations.findIndex(n => n.navigationId === navigationId);
				if(index === -1){
					return;
				}
				this.navigations.splice(index, 1);
			},
			async addNavigation(notification){
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
				macros.requestToEmitRules({tabId});
			}
		}
	})
})()