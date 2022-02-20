import { macros } from '../sandbox/macros';

class Selection{
	constructor(){
		this.selectedRules = [];
		this.selectionExists = false;
		this.selectionHasExisted = false;
	}
	getSelectedRules(){
		return this.selectedRules.slice();
	}
	ruleIsSelected(ruleId){
		return this.selectedRules.some(id => id === ruleId);
	}
	selectRules(ruleIds){
		for(let ruleId of ruleIds){
			if(!this.selectedRules.includes(ruleId)){
				this.selectedRules.push(ruleId);
			}
		}
		if(this.selectedRules.length > 0){
			this.selectionExists = true;
			this.selectionHasExisted = true;
		}
	}
	clear(){
		this.selectedRules.splice(0, this.selectedRules.length);
		this.selectionExists = false;
	}
	selectRule(ruleId, selected){
		const index = this.selectedRules.findIndex(id => id === ruleId);
		if(selected && index === -1){
			this.selectedRules.push(ruleId);
			this.selectionExists = true;
			this.selectionHasExisted = true;
		}else if(!selected && index > -1){
			this.selectedRules.splice(index, 1);
			if(this.selectedRules.length === 0){
				this.selectionExists = false;
			}
		}
	}
}
new Vue({
	el: '#app',
	data: function(){
		return {
			rules: [],
			ruleIds: [],
			selection: new Selection(),
			fileUploadError: undefined,
			fileUploadSuccessMessage: undefined
		};
	},
	mounted: function(){
		this.initialize();
	},
	computed: {
		selectionExists(){
			return this.selection.selectionExists;
		},
		resultMessage(){
			return this.fileUploadError || this.fileUploadSuccessMessage;
		}
	},
	provide(){
		return {
			selection: this.selection
		};
	},
	methods: {
		initialize: async function(){
			await this.refresh();
			macros.onRuleAdded(() => this.refresh());
			macros.onRuleUpdated(() => this.refresh());
		},
		refresh: async function(){
			this.rules = await macros.getAllRules();
			this.ruleIds = this.rules.map(r => r.id);
		},
		onDeleteRuleClicked: async function(rule){
			if(confirm(`Are you sure you want to delete '${rule.name}'?`)){
				await macros.deleteRuleAsync(rule.id);
				this.refresh();
			}
		},
		onFileUploadError(error){
			this.fileUploadError = error;
		},
		onFileUploadSuccess(message){
			this.fileUploadSuccessMessage = message;
		},
		onResultMessageCloseClicked(){
			this.fileUploadError = undefined;
			this.fileUploadSuccessMessage = undefined;
		}
	},
	components: {
		rule: {
			template: document.getElementById("ruleTemplate").innerHTML,
			props: {
				rule: Object
			},
			data: function(){
				return {
					deletable: true
				};
			},
			mounted: function(){
				this.initialize();
			},
			methods: {
				async initialize(){
					var editedStatus = await macros.getEditedStatusAsync(this.rule.id);
					this.deletable = !editedStatus.edited;
					macros.onEditedStatusChanged(({ruleId, edited}) => {
						if(ruleId !== this.rule.id){
							return;
						}
						this.deletable = !edited;
					});
				},
				onDeleteClicked: function(){
					this.$emit('deleteruleclicked')
				},
				onEditClicked: function(){
					macros.requestToOpenEditor({ruleId: this.rule.id});
				}
			},
			components: {
				'rule-selector': {
					template: document.getElementById("ruleSelectorTemplate").innerHTML,
					props: {
						ruleId: Number
					},
					inject: ['selection'],
					computed: {
						selected: {
							get(){
								return this.selection.ruleIsSelected(this.ruleId)
							},
							set(value){
								this.selection.selectRule(this.ruleId, value);
							}
						}
					}
				}
			}
		},
		'action-panel': {
			template: document.getElementById("actionPanelTemplate").innerHTML,
			inject: ['selection'],
			data(){
				return {
					uploadActive: false
				}
			},
			computed: {
				selectionExists(){
					return this.selection.selectionExists;
				}
			},
			methods: {
				async download(){
					const ruleIds = this.selection.getSelectedRules();
					const rules = await macros.getRulesForDownload(ruleIds);
					macros.page.downloadJson(rules, 'rules.json');
				},
				onUploadClicked(){
					this.$refs.fileInput.click();
				},
				onFileInputChange(){
					const files = this.$refs.fileInput.files;
					if(files.length === 1){
						const file = files[0];
						const reader = new FileReader();
						reader.addEventListener('error', () => {
							console.log('error reading file')
							this.$refs.fileInput.value = '';
						});
						reader.addEventListener('load', () => {
							const result = reader.result;
							this.$refs.fileInput.value = '';
							macros.uploadRulesJson(result).then((uploadResult) => {
								if(uploadResult.error){
									this.$emit('file-upload-error', uploadResult.error);
								}else{
									this.$emit('file-upload-success', 'successfully uploaded');
								}
							});
						});
						reader.readAsText(file);
					}
				}
			}
		},
		'selection-actions': {
			template: document.getElementById("selectionActionsPanel").innerHTML,
			props: {
				ruleIds: Array
			},
			inject: ['selection'],
			computed: {
				selectionExists(){
					return this.selection.selectionExists;
				},
				hidden(){
					return this.selection.selectionHasExisted && !this.selection.selectionExists;
				}
			},
			methods: {
				selectAll(){
					this.selection.selectRules(this.ruleIds);
				},
				selectNone(){
					this.selection.clear();
				}
			}
		},
		'result-panel': {
			template: document.getElementById("resultPanelTemplate").innerHTML,
			props: {
				errorMessage: String,
				successMessage: String
			},
			computed: {
				isError(){
					return !!this.errorMessage;
				},
				isSuccess(){
					return !!this.successMessage;
				},
				message(){
					return this.errorMessage || this.successMessage;
				}
			},
			methods: {
				closeClicked(){
					this.$emit('close')
				}
			}
		}
	}
})