import { macros } from '../shared/macros';
import { storage } from '../shared/storage';
import { editors } from '../shared/editors';
import { Event } from '../shared/events';

class Editor{
	constructor(ruleId, ownNavigation, otherNavigationId){
		this.otherNavigationId = otherNavigationId;
		this.ownNavigation = ownNavigation;
		this.ruleId = ruleId;
	}
	focus(){
		this.ownNavigation.focus();
	}
	toJSON(){
		return {
			ruleId: this.ruleId,
			ownNavigationId: this.ownNavigation && this.ownNavigation.id,
			otherNavigationId: this.otherNavigationId
		};
	}
	exists(){
		return macros.navigation.navigationExists(this.ownNavigation.id);
	}
	static async recreate({ruleId, ownNavigationId, otherNavigationId}){
		var ownNavigation = await macros.navigation.getNavigation(ownNavigationId);
		if(!ownNavigation){
			return null;
		}
		return new Editor(ruleId, ownNavigation, otherNavigationId);
	}
}

class EditorCollection{
	constructor(){
		this.loaded = false;
		this.editors = [];
		this.editedStatusChanged = new Event();
	}
	save(){
		storage.setItem('editors', this.editors);
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
	async ensureLoaded(){
		if(this.loaded){
			return;
		}
		var stringifiedEditors = storage.getItem('editors') || [];
		for(var editorMaybe of await Promise.all(stringifiedEditors.map(e => Editor.recreate(e)))){
			if(!editorMaybe){
				continue;
			}
			this.addEditor(editorMaybe);
		}
		this.loaded = true;
	}
	addOpenedEditor(ruleId, navigation, otherNavigationId){
		if(ruleId !== undefined && this.editors.some(e => e.ruleId === ruleId) || this.editors.some(e => e.otherNavigationId === otherNavigationId)){
			return;
		}
		this.addEditor(new Editor(ruleId, navigation, otherNavigationId));
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
		macros.navigation.openTab(editors.createEditorUrl(otherNavigationId, ruleId));
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

var editorCollection = new EditorCollection();

export { editorCollection };