(function(){
	
	new Vue({
		el: "#app",
		data: function(){
			return {

			};
		},
		mounted: function(){
			this.initialize();
		},
		methods: {

			initialize: async function(){
				var navigations = await macros.navigation.getAllForTab(macros.inspectedWindow.tabId);
				console.log(`navigations:`, navigations)
			}
		}
	})
})()