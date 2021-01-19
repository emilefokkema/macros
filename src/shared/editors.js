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
		var navigation = await macros.navigation.openTab('create-rule.html');
		navigation.disappeared.next().then(() => console.log(`an editor has disappeared`))
	}
}

var editors = new EditorCollection();

export { editors };