import { macros } from './shared/macros';
import { storage } from './shared/storage';
import { Event, CancellationToken } from './shared/events';
import { editors } from './shared/editors';

class Editor{
	constructor(ruleId, ownNavigation, otherNavigationId){
		this.otherNavigationId = otherNavigationId;
		this.ownNavigation = ownNavigation;
		this.ruleId = ruleId;
		this.disappeared = new Event();
		this.initialize();
	}
	initialize(){
		this.ownNavigation.disappeared.next().then(() => {
            this.disappeared.dispatch();
		});
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
	}
	save(){
		storage.setItem('editors', this.editors);
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
		this.addEditor(new Editor(ruleId, navigation, otherNavigationId));
		this.save();
		macros.notifyEditedStatusChanged({ruleId, otherNavigationId, edited: true});
	}
	addEditor(editor){
		this.editors.push(editor);
		editor.disappeared.next().then(() => {
			this.removeEditor(editor);
		});
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
	removeEditor(editor){
		var index = this.editors.indexOf(editor);
		if(index > -1){
			this.editors.splice(index, 1);
			macros.notifyEditedStatusChanged({ruleId: editor.ruleId, edited: false});
			this.save();
		}
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