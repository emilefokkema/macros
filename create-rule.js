(function(){
		var resolveInitialized, initializedPromise = new Promise((res) => {resolveInitialized = res;});
		chrome.runtime.onMessage.addListener((msg, sender) => {
			if(msg.initialize){
				resolveInitialized(msg);
			}
		});
		new Vue({
			el: '#app',
			data: function(){
				return {
					url: undefined,
					name: undefined,
					hasPage: false,
					ruleId: undefined,
					urlPattern: undefined,
					actions: []
				};
			},
			mounted: function(){
				this.initialize();
				chrome.runtime.onMessage.addListener((msg, sender) => {
					if(msg.pageDestroyed){
						this.hasPage = false;
					}
				});
			},
			computed: {
				isNew: function(){
					return this.ruleId === undefined;
				}
			},
			methods: {
				onAddType: function(type){
					switch(type){
						case "select": return this.addSelectingAction();
					}
				},
				addSelectingAction: function(){
					this.actions.push({
						type: "select",
						selector: undefined,
						action: {type: "delete"}
					});
				},
				initialize: async function(){
					var initMsg = await initializedPromise;
					if(initMsg.url){
						this.url = initMsg.url;
						this.hasPage = true;
					}
					if(initMsg.ruleId){
						this.ruleId = initMsg.ruleId;
						this.setRule(initMsg.rule);
					}else{
						this.urlPattern = this.url;
					}
				},
				setRule: function(rule){
					this.name = rule.name;
					this.urlPattern = rule.urlPattern;
					this.setTitle();
					this.actions = rule.actions;
				},
				setTitle: function(){
					document.title = `Edit '${this.name}'`
				},
				gotoPage: function(){
					chrome.runtime.sendMessage(undefined, {focusPage: true});
				},
				saveRule: function(){
					var rule = {
						name: this.name,
						urlPattern: this.urlPattern,
						actions: this.actions
					};
					if(this.isNew){
						chrome.runtime.sendMessage(undefined, {createdRule: rule}, (msg) => {
							this.ruleId = msg.ruleId;
							this.setTitle();
						});
					}else{
						chrome.runtime.sendMessage(undefined, {updatedRule: rule}, (msg) => {
							this.setTitle();
						});
					}
				}
			},
			components: {
				'class-finder': {
					template: document.getElementById("classFinderTemplate").innerHTML,
					data: function(){
						return {
							queryProperties: [
								{
									property: undefined,
									value: undefined,
									comparison: "eq"
								}
							],
							result: [],
							collapsed: true
						};
					},
					methods: {
						toggleCollapsed: function(){
							this.collapsed = !this.collapsed;
						},
						search: function(){
							chrome.runtime.sendMessage(undefined, {findSelectors: true, req: {properties: this.queryProperties}}, (resp) => {
								this.result = resp;
							});
						}
					},
					components: {
						'query-property': {
							template: document.getElementById("queryPropertyTemplate").innerHTML,
							props: {
								property: Object
							}
						},
						'selector-match': {
							template: document.getElementById("selectorMatchTemplate").innerHTML,
							props: {
								match: Object
							},
							components: {
								'match-node': {
									template: document.getElementById("matchNodeTemplate").innerHTML,
									props: {
										node: Object
									},
								}
							}
						}
					}
				},
				'action-adder': {
					template: document.getElementById("actionAdderTemplate").innerHTML,
					data: function(){
						return {
							type: "select"
						};
					},
					methods: {
						onAddClicked: function(){
							this.$emit('addtype', this.type);
						}
					}
				},
				'action': {
					template: document.getElementById("actionTemplate").innerHTML,
					props: {
						action: Object,
						runnable: Boolean
					},
					methods: {
						execute: function(){
							console.log(`going to execute action`)
							chrome.runtime.sendMessage(undefined, {executeAction: true, action: this.action}, (resp) => {
								console.log(`executed action with result`, resp)
							})
						}
					},
					components: {
						'select-action': {
							template: document.getElementById("selectActionTemplate").innerHTML,
							props: {
								action: Object
							},
							methods: {
								setDeleteAction: function(){
									this.action.action = {type: "delete"};
								},
								setRemoveClassAction: function(){
									this.action.action = {type: "removeClass", class: undefined}
								}
							},
							computed: {
								actionType: {
									get: function(){
										return this.action.action && this.action.action.type;
									},
									set: function(type){
										if(this.action.action && this.action.action.type === type){
											return;
										}
										switch(type){
											case "delete": return this.setDeleteAction();
											case "removeClass": return this.setRemoveClassAction();
										}
									}
								}
							},
							components: {
								'remove-class-action': {
									template: document.getElementById("removeClassActionTemplate").innerHTML,
									props: {
										action: Object
									},
								}
							}
						}
					}
				}
			}
		});
	})();