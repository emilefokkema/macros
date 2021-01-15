(function(){
		new Vue({
			el: '#app',
			data: function(){
				return {
					name: undefined,
					ruleId: undefined,
					urlPattern: undefined,
					actions: [],
					runningAction: undefined,
					automatic: false,
					isNew: true,
					hasPage: false
				};
			},
			mounted: function(){
				this.initialize();
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
					this.automatic = !!rule.automatic;
				},
				setTitle: function(){
					document.title = `Edit '${this.name}'`
				},
				gotoPage: function(){
					
				},
				saveRule: function(){

				},
				deleteAction: function(action){
					var index = this.actions.indexOf(action);
					if(index > -1){
						this.actions.splice(index, 1);
					}
				},
				executeAction: function(action){
					this.runningAction = action;
				}
			},
			components: {
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