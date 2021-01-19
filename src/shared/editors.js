import { macros } from './macros';

class Editor{
	constructor({otherNavigationId, ownNavigationId, ruleId}){
		this.otherNavigationId = otherNavigationId;
		this.ownNavigationId = ownNavigationId;
		this.ruleId = ruleId;
	}
}

class EditorCollection{
	constructor(){
		this.editors = [];
		this.initializations = [];
	}
	async openEditor({otherNavigationId, ruleId}){
		this.initializations.push({otherNavigationId, ruleId});
		var navigationId = await macros.navigation.openTab('create-rule.html');
	}
}

var editors = new EditorCollection();

export { editors };