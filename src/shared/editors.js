import { openTab } from './open-tab';

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
		var tabId = openTab('create-rule.html');
	}
}

var editors = new EditorCollection();

export { editors };