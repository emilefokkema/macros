(function(){
	var tabId = chrome.devtools.inspectedWindow.tabId;
	new Vue({
		el: "#app",
		data: function(){
			return {
				currentlySelectedElement: undefined,
				currentRules: []
			};
		},
		mounted: function(){
			this.initialize();
		},
		methods: {
			initialize: async function(){
				chrome.runtime.sendMessage(undefined, {devtoolsSidebarOpened: true, devtoolsTabId: tabId}, (init) => {
					console.log(`init message:`, init)
					this.currentlySelectedElement = init.currentlySelectedElement;
					this.currentRules = init.currentRules;
				});
				chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
					if(msg.destinationDevtoolsTabId !== tabId){
						return;
					}
					if(msg.message.currentlySelectedElement !== undefined){
						this.currentlySelectedElement = msg.message.currentlySelectedElement;
					}
				});
			}
		},
		components: {
			node: {
				template: document.getElementById("nodeTemplate").innerHTML,
				props: {
					node: Object
				},
			},
			rule: {
				template: document.getElementById("ruleTemplate").innerHTML,
				props: {
					rule: Object
				},
			}
		}
	})
})()