(function(){

	new Vue({
		el: '#app',
		data: function(){
			return {
				navigations: []
			};
		},
		mounted: function(){
			this.initialize();
		},
		methods: {
			onExecuteClicked: function(rule){
				

			},
			onEditClicked: function(rule){

			},
			goToManagementPage: function(){

			},
			addNavigation(navigation){
				console.log(`adding navigation`,  JSON.parse(JSON.stringify(navigation)))
				var existingIndex = this.navigations.findIndex(n => n.navigationId === navigation.navigationId);
				if(existingIndex > -1){
					this.navigations.splice(existingIndex, 1, navigation)
				}else{
					this.navigations.push(navigation);
				}
			},
			initialize: function(){
				macros.onNotifyRulesForNavigation(navigation => {
					this.addNavigation(navigation);
				});
				macros.notifyPopupOpened();
			}
		},
		components: {
			navigation: {
				template: document.getElementById("navigationTemplate").innerHTML,
				props: {
					navigation: Object
				},
				methods:{
					addRule(){

					},
					onEditClicked(rule){

					},
					onExecuteClicked(rule){

					}
				},
				components: {
					rule: {
						template: document.getElementById("ruleTemplate").innerHTML,
						props: {
							rule: Object
						},
						computed: {
							editable: function(){
								return true;
							},
							isExecuting: function(){
								return false;
							},
							canExecute: function(){
								return true;
							},
							hasExecuted: function(){
								return false;
							}
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