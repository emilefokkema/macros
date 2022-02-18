import { editors } from '../shared/editors';
import { Event } from '../shared/events';

class Editor{
	constructor(navigationInterface, ruleId, ownNavigation, otherNavigationId){
		this.otherNavigationId = otherNavigationId;
		this.ownNavigation = ownNavigation;
		this.ruleId = ruleId;
		this.navigationInterface = navigationInterface;
	}
	focus(){
		this.ownNavigation.focus();
	}
	serialize(){
		return {
			ruleId: this.ruleId,
			ownNavigationId: this.ownNavigation && this.ownNavigation.id,
			otherNavigationId: this.otherNavigationId
		};
	}
	exists(){
		return this.navigationInterface.navigationExists(this.ownNavigation.id);
	}
	static async recreate(navigationInterface, {ruleId, ownNavigationId, otherNavigationId}){
		var ownNavigation = await navigationInterface.getNavigation(ownNavigationId);
		if(!ownNavigation){
			return null;
		}
		return new Editor(navigationInterface, ruleId, ownNavigation, otherNavigationId);
	}
}

class EditorCollection{
	constructor(navigationInterface, storage){
		this.loaded = false;
		this.editors = [];
		this.editedStatusChanged = new Event();
		this.navigationInterface = navigationInterface;
		this.storage = storage;
	}
	save(){
		return this.storage.setItem('editors', this.editors.map(e => e.serialize()));
	}
	async prune(){
		await this.ensureLoaded();
		await Promise.all(this.editors.map(e => this.removeEditorIfNecessary(e)))
		await this.save();
	}
	async getNavigationsWithDraftRule(){
		await this.ensureLoaded();
		return this.editors.filter(e => e.ruleId === undefined && e.otherNavigationId !== undefined).map(e => e.otherNavigationId);
	}
	async removeEditorIfNecessary(editor){
		if(await editor.exists()){
			return;
		}
		var index = this.editors.indexOf(editor);
		if(index === -1){
			return;
		}
		this.editors.splice(index, 1);
		this.editedStatusChanged.dispatch({ruleId: editor.ruleId, edited: false, otherNavigationId: editor.otherNavigationId});
	}
	async tryToAddEditor({ruleId, ownNavigationId, otherNavigationId}){
		var recreated = await Editor.recreate(this.navigationInterface, {ruleId, ownNavigationId, otherNavigationId});
		if(!recreated){
			this.editedStatusChanged.dispatch({ruleId, edited: false});
		}else{
			this.addEditor(recreated);
		}
	}
	async ensureLoaded(){
		if(this.loaded){
			return;
		}
		var stringifiedEditors = await this.storage.getItem('editors') || [];
		await Promise.all(stringifiedEditors.map(e => this.tryToAddEditor(e)));
		this.loaded = true;
	}
	addOpenedEditor(ruleId, navigation, otherNavigationId){
		if(ruleId !== undefined && this.editors.some(e => e.ruleId === ruleId) || ruleId === undefined && this.editors.some(e => e.otherNavigationId === otherNavigationId)){
			return;
		}
		this.addEditor(new Editor(this.navigationInterface, ruleId, navigation, otherNavigationId));
		this.editedStatusChanged.dispatch({ruleId, otherNavigationId, edited: true});
		this.save();
	}
	addEditor(editor){
		this.editors.push(editor);
	}
	async findEditor(otherNavigationId, ruleId){
		await this.ensureLoaded();
		if(ruleId !== undefined){
			var editorForRule = this.editors.find(e => e.ruleId === ruleId);
			if(editorForRule){
				return editorForRule;
			}
		}else if(otherNavigationId !== undefined){
			var editorForOtherNavigation = this.editors.find(e => e.otherNavigationId === otherNavigationId);
			if(editorForOtherNavigation){
				return editorForOtherNavigation;
			}
		}
		return null;
	}
	async createEditor(otherNavigationId, ruleId){
		this.navigationInterface.openTab(editors.createEditorUrl(otherNavigationId, ruleId));
		await this.editedStatusChanged.when(({ruleId: _ruleId, otherNavigationId: _otherNavigationId, edited}) => edited && (ruleId !== undefined && _ruleId === ruleId || _otherNavigationId === otherNavigationId));
	}
	async ensureEditorOpen(otherNavigationId, ruleId){
		const existingEditor = await this.findEditor(otherNavigationId, ruleId);
		if(existingEditor){
			return;
		}
		await this.createEditor(otherNavigationId, ruleId);
	}
	async openEditor({navigationId: otherNavigationId, ruleId}){
		const existingEditor = await this.findEditor(otherNavigationId, ruleId);
		if(existingEditor){
			existingEditor.focus();
			return;
		}
		await this.createEditor(otherNavigationId, ruleId);
	}
	async getEditableStatus(ruleId, navigationId){
		await this.ensureLoaded();
		const editorForRule = this.editors.find(e => e.ruleId === ruleId);
		return !editorForRule || editorForRule.otherNavigationId === navigationId;
	}
	async getEditedStatus(ruleId){
		await this.ensureLoaded();
		var editorForRule = this.editors.find(e => e.ruleId === ruleId);
		if(!editorForRule){
			return {edited: false};
		}
		return {
			edited: true,
			navigationId: editorForRule.otherNavigationId
		};
	}
}

export { EditorCollection };