(function(){
		new Vue({
			el: '#app',
			data: function(){
				return {
					url: undefined,
					name: undefined,
					hasPage: false,
					ruleId: undefined,
					urlPattern: undefined,
					actions: [],
					runningAction: undefined
				};
			},
			mounted: function(){
				this.initialize();
				chrome.runtime.onMessage.addListener((msg, sender) => {
					if(msg.pageDestroyed){
						this.hasPage = false;
					}else if(msg.addActionForSelector){
						this.addActionsForSelectors([msg.selector]);
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
				initialize: function(){
					chrome.runtime.sendMessage(undefined, {initialize: true}, initMsg => {
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
						this.addActionsForSelectors(initMsg.selectorsForWhichToAddActions);
					});
				},
				addActionsForSelectors(selectors){
					for(let selector of selectors){
						this.actions.push({
							type: "select",
							selector: selector,
							action: {
								type: "delete"
							}
						});
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
				},
				deleteAction: function(action){
					var index = this.actions.indexOf(action);
					if(index > -1){
						this.actions.splice(index, 1);
					}
				},
				executeAction: function(action){
					this.runningAction = action;
					console.log(`going to execute action`)
					chrome.runtime.sendMessage(undefined, {executeAction: true, action: action}, (resp) => {
						console.log(`executed action with result`, resp);
						this.runningAction = undefined;
					})
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
						runningaction: Object,
						runnable: Boolean
					},
					methods: {
						execute: function(){
							this.$emit('executeclicked');
						},
						deleteClicked: function(){
							this.$emit('deleteclicked');
						}
					},
					computed: {
						canExecute: function(){
							return this.runnable && !this.runningaction;
						},
						isExecuting: function(){
							return this.runningaction === this.action;
						},
						otherIsExecuting: function(){
							return !!this.runningaction && this.runningaction !== this.action;
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
								},
								setRemoveStylePropertyAction: function(){
									this.action.action = {type: "removeStyleProperty", property: undefined};
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
											case "removeStyleProperty": return this.setRemoveStylePropertyAction();
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
								},
								'remove-style-property-action': {
									template: document.getElementById("removeStylePropertyActionTemplate").innerHTML,
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