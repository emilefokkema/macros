import { CombinedEventSource, Event } from './shared/events';
import { DocumentMutations } from './document-mutations'

class Selector{
	constructor(text, attributeNames){
		this.text = text;
		this.attributeNames = attributeNames;
	}
	static create(text){
		var attributeNames = [];
		var hasId = false;
		var hasClass = false;
		var rgx = /(?:#([^\.\[]+))|(?:\.([^#\.\[]+))|\[([^=]+)(?:=(?:"[^"]*"|[^\]]+))?\]/g;
		var match;
		while((match = rgx.exec(text)) !== null){
			if(match[1]){
				hasId = true;
			}else if(match[2]){
				hasClass = true;
			}else if(match[3]){
				attributeNames.push(match[3])
			}
		}
		if(hasId && !attributeNames.some(n => n === 'id')){
			attributeNames.push('id');
		}
		if(hasClass && !attributeNames.some(n => n === 'class')){
			attributeNames.push('class');
		}
		return new Selector(text, attributeNames);
	}
}

class DeleteNode{
	getEffectOnNode(node){
		return 'will delete this element';
	}
	hasEffectOnNode(node){
		return true;
	}
	execute(node){
		if(!node || !node.parentNode){
			return;
		}
		try{
			node.parentNode.removeChild(node);
		}catch(e){
			
		}
	}
}

class RemoveClass{
	constructor(definition){
		this.class = definition.class;
	}
	getEffectOnNode(node){
		return `will remove class '${this.class}' from this element`;
	}
	hasEffectOnNode(node){
		var classes = node.getAttribute('class');
		if(!classes){
			return false;
		}
		var matches = classes.match(/\S+/g);
		for(var match of matches){
			if(match === this.class){
				return true;
			}
		}
		return false;
	}
	execute(node){
		var classes = node.getAttribute('class');
		if(!classes){
			return;
		}
		var matches = classes.match(/\S+/g);
		var newClasses = [];
		for(var match of matches){
			if(match === this.class){
				continue;
			}
			newClasses.push(match);
		}
		node.setAttribute('class', newClasses.join(' '));
	}
}

class RemoveStyleProperty{
	constructor(definition){
		this.property = definition.property;
	}
	getEffectOnNode(node){
		return `will remove property '${this.property}' from this element's style declaration`;
	}
	nodeStyleDeclarationContainsProperty(node){
		for(var i = 0; i < node.style.length; i++){
			if(node.style[i] === this.property){
				return true;
			}
		}
		return false;
	}
	execute(node){
		if(!this.nodeStyleDeclarationContainsProperty(node)){
			return;
		}
		node.style.removeProperty(this.property);
	}
	hasEffectOnNode(node){
		return this.nodeStyleDeclarationContainsProperty(node);
	}
}

function createSelectedNodeAction(definition){
	switch(definition.type){
		case "delete": return new DeleteNode(definition);
		case "removeClass": return new RemoveClass(definition);
		case "removeStyleProperty": return new RemoveStyleProperty(definition);
	}
}

class SelectAction{
	constructor(definition){
		this.selector = Selector.create(definition.selector);
		this.action = createSelectedNodeAction(definition.action);
		this.hasSomethingToDoChanged = new DocumentMutations(this.selector.attributeNames)
			.map(() => [this.hasSomethingToDo()]).compare(() => [this.hasSomethingToDo()])
			.filter(([hadSomethingToDo], [hasSomethingToDo]) => {
				return hadSomethingToDo !== hasSomethingToDo;
			});
	}
	getEffectOnNode(node){
		if(!node.matches(this.selector.text)){
			return null;
		}
		return this.action.getEffectOnNode(node);
	}
	hasSomethingToDo(){
		var nodes = document.querySelectorAll(this.selector.text);
		if(nodes.length === 0){
			return false;
		}
		for(var i = 0; i < nodes.length; i++){
			if(this.action.hasEffectOnNode(nodes[i])){
				return true;
			}
		}
		return false;
	}
	execute(){
		try{
			var nodes = document.querySelectorAll(this.selector.text);
			if(nodes.length === 0){
				return;
			}
			for(var i = 0; i < nodes.length; i++){
				this.action.execute(nodes[i]);
			}
		}catch(e){
			
		}
	}
}

function createAction(definition){
	switch(definition.type){
		case 'select': return new SelectAction(definition);
	}
}

class ContentScriptRule{
	constructor(definition){
		this.id = definition.id;
		this.name = definition.name;
		this.actions = definition.actions.map(d => createAction(d));
		this.hasExecuted = false;
		this.hasSomethingToDoChanged = new CombinedEventSource(this.actions.map(a => a.hasSomethingToDoChanged))
			.map(() => [this.hasSomethingToDo()]).compare(() => [this.hasSomethingToDo()])
			.filter(([hadSomethingToDo], [hasSomethingToDo]) => hadSomethingToDo !== hasSomethingToDo);
	}
	getNotification(){
		return {
			name: this.name,
			id: this.id,
			hasSomethingToDo: this.hasSomethingToDo(),
			hasExecuted: this.hasExecuted
		};
	}
	hasSomethingToDo(){
		for(let action of this.actions){
			if(action.hasSomethingToDo()){
				return true;
			}
		}
		return false;
	}
	execute(){
		for(let action of this.actions){
			action.execute();
		}
		this.hasExecuted = true;
	}
}

class ContentScriptRuleCollection{
	constructor(getAllDefinitionsAsync){
		this.getAllDefinitionsAsync = getAllDefinitionsAsync;
		this.ruleHasSomethingToDoChanged = new CombinedEventSource([]);
		this.collectionUpdated = new Event();
		this.notifications = new CombinedEventSource([this.collectionUpdated, this.ruleHasSomethingToDoChanged])
			.map(() => [this.getNotification()]);
		this.rules = [];
	}
	async refresh(){
		var definitions = await this.getAllDefinitionsAsync();
		var currentRuleIds = this.rules.map(r => r.id);
		var oldRuleIds = currentRuleIds.filter(id => !definitions.some(d => d.id === id));
		for(let oldRuleId of oldRuleIds){
			this.removeRuleInternal(oldRuleId);
		}
		var newDefinitions = definitions.filter(d => !currentRuleIds.some(id => id === d.id));
		for(let newDefinition of newDefinitions){
			this.addRuleForDefinition(newDefinition);
		}
		if(oldRuleIds.length > 0 || newDefinitions.length > 0){
			this.collectionUpdated.dispatch();
		}
	}
	getRule(ruleId){
		return this.rules.find(r => r.id === ruleId);
	}
	addRuleForDefinition(definition){
		var rule = new ContentScriptRule(definition);
		this.rules.push(rule);
		this.ruleHasSomethingToDoChanged.addSource(rule.hasSomethingToDoChanged);
	}
	removeRuleInternal(ruleId){
		var index = this.rules.findIndex(r => r.id === ruleId);
		if(index === -1){
			return false;;
		}
		var [rule] = this.rules.splice(index, 1);
		this.ruleHasSomethingToDoChanged.removeSource(rule.hasSomethingToDoChanged);
		return true;
	}
	removeRule(ruleId){
		if(this.removeRuleInternal(ruleId)){
			this.collectionUpdated.dispatch();
		}
	}
	getNotification(){
		var ruleNotifications = this.rules.map(r => r.getNotification());
		return {
			rules: ruleNotifications,
			numberOfRules: ruleNotifications.length,
			numberOfRulesThatHaveSomethingToDo: ruleNotifications.filter(r => r.hasSomethingToDo).length,
			numberOfRulesThatHaveExecuted: ruleNotifications.filter(r => r.hasExecuted).length
		};
	}
}

export { ContentScriptRuleCollection, createAction };