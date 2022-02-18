import { CombinedEventSource, Event, CancellationToken } from '../shared/events';
import { Selector } from '../shared/selector';
import { ruleDefinitions } from '../shared/rule-definitions';

class NoopUndoing{
	execute(){}
}

class NodeRemovalUndoing{
	constructor(removedNode, nextSibling, parent){
		this.removedNode = removedNode;
		this.nextSibling = nextSibling;
		this.parent = parent;
	}
	execute(){
		if(!!this.nextSibling && this.nextSibling.parentNode === this.parent){
			this.parent.insertBefore(this.removedNode, this.nextSibling);
		}else{
			this.parent.appendChild(this.removedNode);
		}
	}
}

class ClassRemovalUndoing{
	constructor(node, className){
		this.node = node;
		this.className = className;
	}
	execute(){
		this.node.classList.add(this.className);
	}
}

class StylePropertyRemovalUndoing{
	constructor(node, propertyName, propertyValue){
		this.node = node;
		this.propertyName = propertyName;
		this.propertyValue = propertyValue;
	}
	execute(){
		this.node.style.setProperty(this.propertyName, this.propertyValue);
	}
}

class SequenceUndoing{
	constructor(){
		this.undoings = [];
	}
	add(undoing){
		this.undoings.push(undoing);
	}
	execute(){
		for(let i = this.undoings.length - 1; i >= 0; i--){
			this.undoings[i].execute();
		}
	}
}

class DeleteNode{
	getEffectOnNode(node){
		return {
			description: 'will delete this element',
			actionDefinition: ruleDefinitions.getDeleteActionDefinition()
		};
	}
	hasEffectOnNode(node){
		return true;
	}
	execute(node){
		if(!node || !node.isConnected){
			return new NoopUndoing();
		}
		try{
			const nextElementSibling = node.nextElementSibling;
			const parentNode = node.parentNode;
			node.remove();
			return new NodeRemovalUndoing(node, nextElementSibling, parentNode);
		}catch(e){
			return new NoopUndoing();
		}
	}
}

class RemoveClass{
	constructor(definition){
		this.class = definition.class;
	}
	getEffectOnNode(node){
		if(!this.hasEffectOnNode(node)){
			return null;
		}
		return {
			description: `will remove class '${this.class}' from this element`,
			actionDefinition: ruleDefinitions.getRemoveClassActionDefinition(this.class)
		};
	}
	hasEffectOnNode(node){
		return  node.classList && node.classList.contains(this.class);
	}
	execute(node){
		if(!node || !node.classList){
			return new NoopUndoing();
		}
		node.classList.remove(this.class);
		return new ClassRemovalUndoing(node, this.class);
	}
}

class RemoveStyleProperty{
	constructor(definition){
		this.property = definition.property;
	}
	getEffectOnNode(node){
		if(!this.hasEffectOnNode(node)){
			return null;
		}
		return {
			description: `will remove property '${this.property}' from this element's style declaration`,
			actionDefinition: ruleDefinitions.getRemoveStylePropertyActionDefinition(this.property)
		};
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
			return new NoopUndoing();
		}
		const propertyValue = node.style.getPropertyValue(this.property);
		node.style.removeProperty(this.property);
		return new StylePropertyRemovalUndoing(node, this.property, propertyValue);
	}
	hasEffectOnNode(node){
		return this.nodeStyleDeclarationContainsProperty(node);
	}
}

function createSelectedNodeAction(definition){
	switch(definition.type){
		case ruleDefinitions.DELETE_ACTION_TYPE: return new DeleteNode(definition);
		case ruleDefinitions.REMOVE_CLASS_ACTION_TYPE: return new RemoveClass(definition);
		case ruleDefinitions.REMOVE_STYLE_PROPERTY_ACTION_TYPE: return new RemoveStyleProperty(definition);
	}
}

class SelectAction{
	constructor(definition, documentMutationsProvider){
		this.selector = Selector.create(definition.selector);
		this.action = createSelectedNodeAction(definition.action);
		this.hasSomethingToDoChanged = documentMutationsProvider.getMutations(this.selector.attributeNames)
			.map(() => [this.hasSomethingToDo()]).compare(() => [this.hasSomethingToDo()])
			.filter(([hadSomethingToDo], [hasSomethingToDo]) => {
				return hadSomethingToDo !== hasSomethingToDo;
			});
		this.effectOnElementSelectedInDevtools = null;
		this.effectOnElementSelectedInDevtoolsChanged = new Event();
	}
	getEffectOnNode(node){
		if(!node.matches(this.selector.text)){
			return null;
		}
		return this.action.getEffectOnNode(node);
	}
	addEffectForElementSelectedInDevtools(elementSelectedInDevtools){
		const effect = elementSelectedInDevtools && elementSelectedInDevtools.matches(this.selector.text) ? this.action.getEffectOnNode(elementSelectedInDevtools) : null;
		if(effect == null && this.effectOnElementSelectedInDevtools == null){
			return;
		}
		this.effectOnElementSelectedInDevtools = effect;
		this.effectOnElementSelectedInDevtoolsChanged.dispatch();
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
			console.log(`executing rule for ${nodes.length} nodes matching ${this.selector.text}`)
			const undoing = new SequenceUndoing();
			for(var i = 0; i < nodes.length; i++){
				undoing.add(this.action.execute(nodes[i]));
			}
			return undoing;
		}catch(e){
			return new NoopUndoing();
		}
	}
}

function createAction(definition, documentMutationsProvider){
	switch(definition.type){
		case ruleDefinitions.SELECT_ACTION_TYPE: return new SelectAction(definition, documentMutationsProvider);
	}
}

class ContentScriptRule{
	constructor(definition, documentMutationsProvider, editable){
		this.id = definition.id;
		this.name = definition.name;
		this.automatic = !!definition.automatic;
		this.actions = definition.actions.map(d => createAction(d, documentMutationsProvider));
		this.hasExecuted = false;
		this.editable = editable;
		this.hasSomethingToDoChanged = new CombinedEventSource(this.actions.map(a => a.hasSomethingToDoChanged))
			.map(() => [this.hasSomethingToDo()]).compare(() => [this.hasSomethingToDo()])
			.filter(([hadSomethingToDo], [hasSomethingToDo]) => hadSomethingToDo !== hasSomethingToDo)
			.map(([hadSomethingToDo], [hasSomethingToDo]) => [hasSomethingToDo]);
		this.effectOnElementSelectedInDevtoolsChanged = new CombinedEventSource(this.actions.map(a => a.effectOnElementSelectedInDevtoolsChanged));
		this.editableChanged = new Event();
	}
	getNotification(){
		return {
			name: this.name,
			id: this.id,
			hasSomethingToDo: this.hasSomethingToDo(),
			hasExecuted: this.hasExecuted
		};
	}
	getState(){
		return {
			name: this.name,
			id: this.id,
			hasSomethingToDo: this.hasSomethingToDo(),
			hasExecuted: this.hasExecuted,
			editable: this.editable,
			effectsOnElement: this.actions.map(a => a.effectOnElementSelectedInDevtools).filter(e => !!e)
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
	setEditable(editable){
		if(editable === this.editable){
			return;
		}
		this.editable = editable;
		this.editableChanged.dispatch();
	}
	addEffectsForElementSelectedInDevtools(elementSelectedInDevtools){
		for(let action of this.actions){
			action.addEffectForElementSelectedInDevtools(elementSelectedInDevtools);
		}
	}
	getEffectOnNode(node){
		return this.actions.map(a => a.getEffectOnNode(node)).filter(e => !!e);
	}
}

class ContentScriptRuleCollection{
	constructor(macros, documentMutationsProvider){
		this.macros = macros;
		this.documentMutationsProvider = documentMutationsProvider;
		this.ruleEventSubscriptions = [];
		this.draftRuleEventSubscriptions = [];
		this.ruleHasSomethingToDoChanged = new Event();
		this.draftRuleHasSomethingToDoChanged = new Event();
		this.effectOnElementSelectedInDevtoolsChanged = new Event();
		this.ruleEditableChanged = new Event();
		this.effectOfDraftRuleOnElementSelectedInDevtoolsChanged = new Event();
		this.collectionUpdated = new Event();
		this.ruleAdded = new Event();
		this.ruleRemoved = new Event();
		this.ruleExecuted = new Event();
		this.notifications = new CombinedEventSource([this.collectionUpdated, this.ruleHasSomethingToDoChanged])
			.map(() => [this.getNotification()]);
		this.rules = [];
		this.draftRule = undefined;
		this.automaticExecutions = [];
	}
	async refresh(url, navigationId, elementSelectedInDevtools){
		var definitions = await this.macros.getRulesForUrl(url);
		var draftRuleDefinition = await this.macros.getDraftRuleForNavigation(navigationId);
		this.setDraftRuleForDefinition(draftRuleDefinition);
		var currentRuleIds = this.rules.map(r => r.id);
		var oldRuleIds = currentRuleIds.filter(id => !definitions.some(d => d.id === id));
		var updated = false;
		for(let oldRuleId of oldRuleIds){
			this.removeRuleInternal(oldRuleId);
			updated = true;
		}
		var newDefinitions = definitions.filter(d => !currentRuleIds.some(id => id === d.id));
		for(let newDefinition of newDefinitions){
			await this.addRuleForDefinition(newDefinition, navigationId, elementSelectedInDevtools);
			this.ruleAdded.dispatch({ruleId: newDefinition.id});
			updated = true;
		}
		if(updated){
			this.collectionUpdated.dispatch();
		}
	}
	stopAutomaticRuleExecution(ruleId){
		var index = this.automaticExecutions.findIndex(e => e.ruleId === ruleId);
		if(index === -1){
			return;
		}
		var [{cancellationToken}] = this.automaticExecutions.splice(index, 1);
		cancellationToken.cancel();
	}
	cancelRuleEventSubscriptions(ruleId){
		const subscriptionRecordIndex = this.ruleEventSubscriptions.findIndex(r => r.ruleId === ruleId);
		if(subscriptionRecordIndex === -1){
			return;
		}
		const [subscriptionRecord] = this.ruleEventSubscriptions.splice(subscriptionRecordIndex, 1);
		for(let subscription of subscriptionRecord.subscriptions){
			subscription.cancel();
		}
	}
	async executeAutomatically(rule, cancellationToken){
		do{
			if(cancellationToken.cancelled){
				console.log(`stopping automatic execution of rule '${rule.name}'`)
				break;
			}
			if(!rule.hasSomethingToDo()){
				console.log(`waiting until rule '${rule.name}' has something to do before executing automatically`)
				await rule.hasSomethingToDoChanged.when(hasSomethingToDo => hasSomethingToDo, cancellationToken);
			}
			if(cancellationToken.cancelled){
				console.log(`stopping automatic execution of rule '${rule.name}'`)
				break;
			}
			console.log(`executing rule '${rule.name}' automatically`)
			rule.execute();
			this.ruleExecuted.dispatch({ruleId: rule.id})
			if(rule.hasSomethingToDo()){
				console.log(`after executing, rule '${rule.name}' still has something to do; stopping automatic execution`);
				break;
			}
		}while(true);
	}
	getRule(ruleId){
		return this.rules.find(r => r.id === ruleId);
	}
	executeDraftRule(){
		if(!this.draftRule){
			return;
		}
		this.draftRule.execute();
	}
	executeRule(ruleId){
		const rule = this.rules.find(r => r.id === ruleId);
		if(!rule){
			return;
		}
		rule.execute();
		this.ruleExecuted.dispatch({ruleId: rule.id})
	}
	setEditable(ruleId, editable){
		const rule = this.rules.find(r => r.id === ruleId);
		if(!rule){
			return;
		}
		rule.setEditable(editable);
	}
	addEffectsForElementSelectedInDevtools(elementSelectedInDevtools){
		for(let rule of this.rules){
			rule.addEffectsForElementSelectedInDevtools(elementSelectedInDevtools);
		}
		if(this.draftRule){
			this.draftRule.addEffectsForElementSelectedInDevtools(elementSelectedInDevtools);
		}
	}
	setDraftRuleForDefinition(definition, elementSelectedInDevtools){
		for(let subscription of this.draftRuleEventSubscriptions){
			subscription.cancel();
		}
		this.draftRuleEventSubscriptions = [];
		if(!definition){
			this.draftRule = undefined;
		}else{
			this.draftRule = new ContentScriptRule(definition, this.documentMutationsProvider, true);
			this.draftRule.addEffectsForElementSelectedInDevtools(elementSelectedInDevtools);
			this.draftRuleEventSubscriptions = [
				this.draftRule.hasSomethingToDoChanged.listen((hasSomethingToDo) => {
					this.draftRuleHasSomethingToDoChanged.dispatch({hasSomethingToDo});
				}),
				this.draftRule.effectOnElementSelectedInDevtoolsChanged.listen(() => {
					this.effectOfDraftRuleOnElementSelectedInDevtoolsChanged.dispatch();
				})
			];
		}
	}
	async addRuleForDefinition(definition, navigationId, elementSelectedInDevtools){
		const editable = await this.macros.getEditableStatus(definition.id, navigationId);
		var rule = new ContentScriptRule(definition, this.documentMutationsProvider, editable);
		rule.addEffectsForElementSelectedInDevtools(elementSelectedInDevtools);
		this.rules.push(rule);

		this.ruleEventSubscriptions.push({
			ruleId: rule.id,
			subscriptions: [
				rule.hasSomethingToDoChanged.listen((hasSomethingToDo) => {
					this.ruleHasSomethingToDoChanged.dispatch({
						ruleId: rule.id,
						hasSomethingToDo
					});
				}),
				rule.effectOnElementSelectedInDevtoolsChanged.listen(() => {
					this.effectOnElementSelectedInDevtoolsChanged.dispatch({ruleId: rule.id});
				}),
				rule.editableChanged.listen(() => {
					this.ruleEditableChanged.dispatch({ruleId: rule.id});
				})
			]
		});
		if(rule.automatic){
			var cancellationToken = new CancellationToken();
			this.automaticExecutions.push({ruleId: rule.id, cancellationToken})
			this.executeAutomatically(rule, cancellationToken).then(() => this.stopAutomaticRuleExecution(rule.id));
		}
	}
	removeRuleInternal(ruleId){
		var index = this.rules.findIndex(r => r.id === ruleId);
		if(index === -1){
			return false;;
		}
		var [rule] = this.rules.splice(index, 1);
		this.cancelRuleEventSubscriptions(ruleId);
		this.stopAutomaticRuleExecution(ruleId);
		return true;
	}
	removeRule(ruleId){
		if(this.removeRuleInternal(ruleId)){
			this.collectionUpdated.dispatch();
			this.ruleRemoved.dispatch({ruleId});
			return true;
		}
		return false;
	}
	getStateForDraftRule(){
		if(!this.draftRule){
			return null;
		}
		return this.draftRule.getState();
	}
	getStateForRule(ruleId){
		const rule = this.rules.find(r => r.id === ruleId);
		if(!rule){
			return null;
		}
		return rule.getState();
	}
	getStates(){
		const result = [];
		for(let rule of this.rules){
			result.push(rule.getState());
		}
		return result;
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
	getEffectOnNode(node){
		const result = this.rules.map(rule => ({
			ruleId: rule.id,
			effect: rule.getEffectOnNode(node)
		}));
		if(this.draftRule){
			result.push({
				effect: this.draftRule.getEffectOnNode(node)
			})
		}
		return result;
	}
}

export { ContentScriptRuleCollection, createAction };