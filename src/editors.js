import { macros } from './shared/macros';
import { storage } from './shared/storage';
import { Event, CancellationToken } from './shared/events';

class Editor{
	constructor(ruleId, ownNavigation, otherNavigation){
		this.otherNavigation = otherNavigation;
		this.ownNavigation = ownNavigation;
		this.ruleId = ruleId;
		this.disappeared = new Event();
		this.updated = new Event();
		this.initialize();
	}
	initialize(){
		this.ownNavigation.disappeared.next().then(() => {
            this.disappeared.dispatch();
		});
		if(this.otherNavigation){
			this.otherNavigation.disappeared.next().then(() => {
				this.otherNavigation = undefined;
				this.updated.dispatch();
			});
		}
	}
	toJSON(){
		return {
			ruleId: this.ruleId,
			ownNavigationId: this.ownNavigation && this.ownNavigation.id,
			otherNavigationId: this.otherNavigation && this.otherNavigation.id
		};
	}
	static async recreate({ruleId, ownNavigationId, otherNavigationId}){
		var ownNavigation = await macros.navigation.getNavigation(ownNavigationId);
		if(!ownNavigation){
			return null;
		}
		var otherNavigation = otherNavigationId ? await macros.navigation.getNavigation(otherNavigationId): undefined;
		return new Editor(ruleId, ownNavigation, otherNavigation);
	}
}

class EditorCollection{
	constructor(){
		this.loaded = false;
		this.editors = [];
		this.initializations = [];
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
	addEditor(editor){
		var cancellationToken = new CancellationToken();
		this.editors.push(editor);
		editor.disappeared.next().then(() => {
			this.removeEditor(editor);
			cancellationToken.cancel();
		});
		editor.updated.listen(() => this.save(), cancellationToken);
	}
	async openEditor({navigationId: otherNavigationId, ruleId}){
		await this.ensureLoaded();
		this.initializations.push({otherNavigationId, ruleId});
		var otherNavigation = undefined;
		if(otherNavigationId !== undefined){
			otherNavigation = await macros.navigation.getNavigation(otherNavigationId);
		}
		var navigation = await macros.navigation.openTab('create-rule.html');
		var editor = new Editor(ruleId, navigation, otherNavigation);
		this.addEditor(editor);
		this.save();
	}
	removeEditor(editor){
		var index = this.editors.indexOf(editor);
		if(index > -1){
			this.editors.splice(index, 1);
			this.save();
		}
	}
	getEditorInitialization(){
		return this.initializations.shift();
	}
}

var editors = new EditorCollection();

export { editors };