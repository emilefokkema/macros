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
	execute(node, executionContext){
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
		this.action = createSelectedNodeAction(definition.action)
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
		this.actions = definition.actions.map(a => createAction(a));
		this.hasSomethingToDo = false;
	}
	getNotification(){
		return {
			name: this.name,
			id: this.id,
			hasSomethingToDo: this.hasSomethingToDo
		};
	}
	dispose(){

	}
}

export { ContentScriptRule };