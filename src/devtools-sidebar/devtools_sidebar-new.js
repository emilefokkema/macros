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
			addNavigation(navigation){
				navigation.origin = new URL(navigation.url).origin;
				this.navigations.push(navigation);
				if(!this.selectedNavigation){
					this.selectedNavigation = navigation;
				}
				console.log(`adding navigation:`, navigation);
			},
			initialize: async function(){
				var navigations = [];
				macros.onNotifyRulesForNavigation(notification => {
					if(!navigations.some(n => n.id === notification.navigationId)){
						return;
					}
					this.addNavigation(notification);
				});
				navigations = await macros.navigation.getAllForTab(macros.inspectedWindow.tabId);
				macros.requestToEmitRules({navigationIds: navigations.map(n => n.id)});
			}
		}
	})
})()