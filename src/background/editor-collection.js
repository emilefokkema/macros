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
		this.storage.setItem('editors', this.editors.map(e => e.serialize()));
	}
	async prune(){
		await this.ensureLoaded();
		await Promise.all(this.editors.map(e => this.removeEditorIfNecessary(e)))
		this.save();
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
		this.editedStatusChanged.dispatch({ruleId: editor.ruleId, edited: false});
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
		var stringifiedEditors = this.storage.getItem('editors') || [];
		await Promise.all(stringifiedEditors.map(e => this.tryToAddEditor(e)));
		this.loaded = true;
	}
	addOpenedEditor(ruleId, navigation, otherNavigationId){
		if(ruleId !== undefined && this.editors.some(e => e.ruleId === ruleId) || ruleId === undefined && this.editors.some(e => e.otherNavigationId === otherNavigationId)){
			return;
		}
		this.addEditor(new Editor(this.navigationInterface, ruleId, navigation, otherNavigationId));
		this.save();
		this.editedStatusChanged.dispatch({ruleId, otherNavigationId, edited: true});
	}
	addEditor(editor){
		this.editors.push(editor);
	}
	async openEditor({navigationId: otherNavigationId, ruleId}){
		await this.ensureLoaded();
		if(ruleId !== undefined){
			var editorForRule = this.editors.find(e => e.ruleId === ruleId);
			if(editorForRule){
				editorForRule.focus();
				return true;
			}
		}else if(otherNavigationId !== undefined){
			var editorForOtherNavigation = this.editors.find(e => e.otherNavigationId === otherNavigationId);
			if(editorForOtherNavigation){
				editorForOtherNavigation.focus();
				return true;
			}
		}
		this.navigationInterface.openTab(editors.createEditorUrl(otherNavigationId, ruleId));
		return false;
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