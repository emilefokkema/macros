class Editor{
	constructor({navigationId, ruleId}){
		this.navigationId = navigationId;
		this.ruleId = ruleId;
	}
}

class EditorCollection{
	constructor(){
		this.editors = [];
	}
	openEditor({navigationId, ruleId}){
		console.log(`going to open editor for navigation '${navigationId}' and rule '${ruleId}'`)
	}
}

var editors = new EditorCollection();

export { editors };