(async function(){
	class ExecutionContext{
		constructor(logPrefix){
			this.error = undefined;
			this.logPrefix = logPrefix;
		}
		reportError(e){
			this.error = e && e.message;
		}
		logInfo(msg, ...rest){
			if(this.logPrefix){
				console.log.apply(console, [`${this.logPrefix} ${msg}`].concat(rest));
			}else{
				console.log(msg, ...rest);
			}
		}
	}
	class RuleExecutionContext extends ExecutionContext{
		constructor(rule){
			super();
			this.rule = rule;
			this.logPrefix = `[${this.rule.name}]`;
		}
		getActionExecutionContext(action){
			return new ExecutionContext(`${this.logPrefix} [${action.getLogSummary()}]`);
		}
		start(){
			this.logInfo(`begin execution`);
		}
		finish(){
			this.logInfo(`execution finished`);
			chrome.runtime.sendMessage(undefined, {ruleExecuted: true, executionStates: getExecutionStates()})
		}
	}
	class ExecutionLog{
		constructor(){
			this.ruleExecutions = [];
			this.actionExecutions = [];
		}
		getActionExecutionContext(action){
			var context = new ExecutionContext(`[${action.getLogSummary()}]`);
			this.actionExecutions.push(context);
			return context;
		}
		getRuleExecutionContext(rule){
			var context = new RuleExecutionContext(rule);
			this.ruleExecutions.push(context);
			return context;
		}
		getExecutionHistory(){
			return this.ruleExecutions.map(r => r.rule.ruleId);
		}
	}
	var executionLog = new ExecutionLog();
	function* getAttributesInSelector(selector){
		var rgx = /\[([^=]+)(?:=(?:"[^"]*"|[^\]]+))?\]/g;
		var match;
		while((match = rgx.exec(selector)) !== null){
			console.log(match);
			yield match[1];
		}
	}
	class Selector{
		constructor(text){
			this.text = text;
			this.attributeNames = [];
			this.id = undefined;
			this.classes = [];
			this.getParts();
		}
		getParts(){
			var rgx = /(?:#([^\.\[]+))|(?:\.([^#\.\[]+))|\[([^=]+)(?:=(?:"[^"]*"|[^\]]+))?\]/g;
			var match;
			while((match = rgx.exec(this.text)) !== null){
				if(match[1]){
					this.id = match[1];
				}else if(match[2]){
					this.classes.push(match[2]);
				}else if(match[3]){
					this.attributeNames.push(match[3])
				}
			}
		}
	}
	class CssPropertyMatcher{
		constructor(propertyName, referent){
			this.propertyName = propertyName;
			this.propertyNameRegExp = new RegExp(`^${propertyName.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[\\S]*?')}$`);
			this.referent = referent;
		}
		*getMatchingPropertyNames(declaration){
			for(var i = 0; i < declaration.length; i++){
				if(declaration[i].match(this.propertyNameRegExp)){
					yield declaration[i];
				}
			}
		}
		declarationContainsProperty(declaration){
			for(var i = 0; i < declaration.length; i++){
				if(declaration[i] === this.propertyName){
					return true;
				}
			}
			return false;
		}
		matchesDeclaration(declaration){
			for(var matchingPropertyName of this.getMatchingPropertyNames(declaration)){
				if(this.matchesDeclarationValue(declaration.getPropertyValue(matchingPropertyName))){
					return true;
				}
			}
			return false;
		}
	}
	class EqualsMatcher extends CssPropertyMatcher{
		matchesDeclarationValue(declarationValue){
			return declarationValue === this.referent;
		}
		toString(){
			return `${this.propertyName} === ${this.referent}`
		}
	}
	class ComparingMatcher extends CssPropertyMatcher{
		constructor(propertyName, referent){
			super(propertyName, referent);
			this.referentValue = this.parseValue(referent);
			this.referentValueIsNaN = isNaN(this.referentValue);
		}
		parseValue(value){
			return parseFloat(value);
		}
		matchesDeclarationValue(declarationValue){
			if(this.referentValueIsNaN){
				return false;
			}
			var actualValue = this.parseValue(declarationValue);
			return !isNaN(actualValue) && this.matchesActualValue(actualValue);
		}
	}
	class LessThanMatcher extends ComparingMatcher{
		matchesActualValue(actualValue){
			return actualValue < this.referentValue;
		}
		toString(){
			return `${this.propertyName} < ${this.referent}`
		}
	}
	class GreaterThanMatcher extends ComparingMatcher{
		matchesActualValue(actualValue){
			return actualValue > this.referentValue;
		}
		toString(){
			return `${this.propertyName} > ${this.referent}`
		}
	}
	class SelectorQuery{
		constructor(restrictions){
			this.matchers = [];
			for(var restriction of restrictions){
				if(!restriction.property){
					continue;
				}
				this.matchers.push(this.createMatcher(restriction));
			}
		}
		createMatcher(restriction){
			switch(restriction.comparison){
				case "eq": return new EqualsMatcher(restriction.property, restriction.value);
				case "lt": return new LessThanMatcher(restriction.property, restriction.value);
				case "gt": return new GreaterThanMatcher(restriction.property, restriction.value);
			}
		}
		matchesDeclaration(declaration){
			if(this.matchers.length === 0){
				return false;
			}
			for(var matcher of this.matchers){
				if(!matcher.matchesDeclaration(declaration)){
					return false;
				}
			}
			return true;
		}
		toString(){
			return this.matchers.map(m => m.toString()).join(' && ');
		}
	}
	class DeleteSelectedNodeAction{
		constructor(definition){

		}
		getEffectOnNode(node){
			return 'will delete this element';
		}
		hasEffectOnNode(node){
			return true;
		}
		execute(node, executionContext){
			if(!node || !node.parentNode){
				return;
			}
			try{
				node.parentNode.removeChild(node);
				executionContext.logInfo('removed node', node)
			}catch(e){
				executionContext.reportError(e);
			}
		}
	}
	class RemoveStylePropertyFromSelectedNodeAction{
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
		execute(node, executionContext){
			if(!this.nodeStyleDeclarationContainsProperty(node)){
				executionContext.logInfo(`no property '${this.property}' found on style declaration for node`, node)
				return;
			}
			node.style.removeProperty(this.property);
			executionContext.logInfo(`removed property '${this.property}' from style declaration for node`, node);
		}
		hasEffectOnNode(node){
			return this.nodeStyleDeclarationContainsProperty(node);
		}
	}
	class RemoveClassFromSelectedNodeAction{
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
				executionContext.logInfo(`no class '${this.class}' found on node`, node)
				return;
			}
			var matches = classes.match(/\S+/g);
			var newClasses = [];
			var removedClass = false;
			for(var match of matches){
				if(match === this.class){
					removedClass = true;
					continue;
				}
				newClasses.push(match);
			}
			node.setAttribute('class', newClasses.join(' '));
			if(removedClass){
				executionContext.logInfo(`removed class '${this.class}' from node`, node)
			}else{
				executionContext.logInfo(`no class '${this.class}' found on node`, node)
			}
		}
	}
	class SelectedNodeAction{
		static create(definition){
			switch(definition.type){
				case "delete": return new DeleteSelectedNodeAction(definition);
				case "removeClass": return new RemoveClassFromSelectedNodeAction(definition);
				case "removeStyleProperty": return new RemoveStylePropertyFromSelectedNodeAction(definition);
			}
		}
	}
	class SelectAction{
		constructor(definition){
			this.selector = new Selector(definition.selector);
			this.action = SelectedNodeAction.create(definition.action);
			this.observer = undefined;
		}
		getLogSummary(){
			return `matching '${this.selector.text}'`;
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
		onSomethingToDo(callback){
			var attributesToWatch = this.selector.attributeNames.slice();
			if(this.selector.id && attributesToWatch.indexOf("id") === -1){
				attributesToWatch.push("id");
			}
			if(this.selector.classes.length > 0 && attributesToWatch.indexOf("class") === -1){
				attributesToWatch.push("class");
			}
			this.observer = new MutationObserver(() => {
				if(this.hasSomethingToDo()){
					callback();
				}
			});
			this.observer.observe(document, {
				childList: true,
				subtree: true,
				attributeFilter: attributesToWatch
			});
		}
		stopLookingForSomethingToDo(){
			if(!this.observer){
				return;
			}
			this.observer.disconnect();
		}
		execute(executionContext){
			try{
				var nodes = document.querySelectorAll(this.selector.text);
				if(nodes.length === 0){
					executionContext.logInfo(`no nodes found to modify`)
					return;
				}
				for(var i = 0; i < nodes.length; i++){
					this.action.execute(nodes[i], executionContext);
				}
			}catch(e){
				executionContext.reportError(e);
			}
		}
	}
	class Action{
		static create(definition){
			switch(definition.type){
				case "select": return new SelectAction(definition)
			}
		}
	}
	class ExecutionResult{
		constructor(){
			this.error = undefined;
		}
		reportError(e){
			this.error = e.message;
		}
	}
	class Rule{
		constructor(definition, ruleId){
			this.ruleId = ruleId;
			this.name = definition.name;
			this.automatic = !!definition.automatic;
			this.actions = definition.actions.map(d => Action.create(d));
			this.initialize();
		}
		initialize(){
			if(!this.automatic){
				return;
			}
			for(let action of this.actions){
				action.onSomethingToDo(() => {
					this.executeAutomatic();
				});
			}
			if(this.hasSomethingToDo()){
				this.executeAutomatic();
			}
		}
		hasSomethingToDo(){
			for(let action of this.actions){
				if(action.hasSomethingToDo()){
					return true;
				}
			}
			return false;
		}
		stopLookingForSomethingToDo(){
			if(!this.automatic){
				return;
			}
			for(let action of this.actions){
				action.stopLookingForSomethingToDo();
			}
		}
		getEffectOnNode(node){
			if(!node){
				return [];
			}
			return this.actions.map(a => a.getEffectOnNode(node)).filter(a => !!a);
		}
		executeManual(){
			var executionContext = executionLog.getRuleExecutionContext(this);
			executionContext.start();
			this.execute(executionContext);
			executionContext.finish();
		}
		executeAutomatic(){
			var executionContext = executionLog.getRuleExecutionContext(this);
			executionContext.start();
			this.execute(executionContext);
			executionContext.finish();
		}
		execute(executionContext){
			for(let action of this.actions){
				var actionExecutionContext = executionContext.getActionExecutionContext(action);
				action.execute(actionExecutionContext);
			}
		}
	}
	function* findCssRulesInSheet(cssStyleSheet){
		try{
			var rules = cssStyleSheet.cssRules;
			for(var i = 0; i < rules.length; i++){
				var rule = rules[i];
				if(rule.type !== CSSRule.STYLE_RULE){
					continue;
				}
				yield rule;
			}
		}catch(e){}
	}
	function* findCssRules(){
		var sheets = document.styleSheets;
		for(var i = 0; i < sheets.length; i++){
			var sheet = sheets[i];
			if(sheet.disabled || sheet.type !== "text/css"){
				continue;
			}
			yield* findCssRulesInSheet(sheet);
		}
	}
	function* findMatches(query){
		for(var rule of findCssRules()){
			if(!query.matchesDeclaration(rule.style)){
				continue;
			}
			var nodes = document.querySelectorAll(rule.selectorText);
			if(nodes.length === 0){
				continue;
			}
			yield {
				cssText: prettifyCssText(rule.cssText),
				nodes: nodes
			}
		}
	}
	function summarizeNode(node){
		var nodeName = node.nodeName.toLowerCase();
		var classAttributeValue = node.getAttribute("class");
		var classes = classAttributeValue ? classAttributeValue.match(/\S+/g) : [];
		var attributes = node.getAttributeNames().filter(n => n !== "id" && n !== "class").map(n => ({attributeName: n, attributeValue: node.getAttribute(n)}));
		return {
			nodeName: nodeName,
			classes: classes,
			id: node.getAttribute("id"),
			attributes: attributes
		};
	}
	function prettifyCssText(cssText){
		var match = cssText.match(/^([^{]*)\{(.*?)\}$/);
		if(!match){
			return "";
		}
		var result = `${match[1]}{\r\n`;
		var partMatch, regex = /([^\s:]+)\s*:\s*(\S[^;]*);/g;
		while((partMatch = regex.exec(match[2])) != null){
			result += `    ${partMatch[1]}: ${partMatch[2]};\r\n`
		}
		return result + "}";
	}
	function serializeMatch(match){
		return {
			cssText: match.cssText,
			nodes: Array.prototype.map.apply(match.nodes, [(n) => summarizeNode(n)])
		};
	}
	function findSelectors(req){
		var query = new SelectorQuery(req.properties);
		console.log(`finding selectors for for which ${query.toString()}`);
		var matches = [];
		for(var match of findMatches(query)){
			console.log(`found css rule: ${match.cssText}. The following nodes match:`);
			for(var node of match.nodes){
				console.log(node)
			}
			matches.push(serializeMatch(match));
		}
		return matches;
	}
	function executeAction(actionDefinition){
		var action = Action.create(actionDefinition);
		var executionContext = executionLog.getActionExecutionContext(action);
		action.execute(executionContext);
	}
	var contentScriptId = +new Date() - Math.floor(Math.random() * 1000);
	var currentRules = [];
	function executeRule(ruleId){
		var rule = currentRules.find(r => r.ruleId === ruleId);
		if(!rule){
			return;
		}
		rule.executeManual();
	}
	var currentlySelectedElement = undefined;
	function setCurrentRules(ruleRecords){
		if(currentRules && currentRules.length > 0){
			for(let rule of currentRules){
				rule.stopLookingForSomethingToDo();
			}
		}
		currentRules = ruleRecords.map(r => new Rule(r.rule, r.ruleId));
	}
	function getEffectsOnCurrentlySelectedElement(){
		return currentRules.map(r => ({
			ruleId: r.ruleId,
			effect: r.getEffectOnNode(currentlySelectedElement)
		}));
	}
	function getExecutionStates(){
		var executedRules = executionLog.getExecutionHistory();
		return currentRules.map(r => ({
			ruleId: r.ruleId,
			hasExecuted: executedRules.some(ruleId => ruleId === r.ruleId),
			hasSomethingToDo: r.hasSomethingToDo()
		}));
	}
	console.log(`hello from content script ${contentScriptId}`)
	elementSelectedInDevtools = function(element){
		currentlySelectedElement = element;
		chrome.runtime.sendMessage(undefined, {elementSelectedInDevtools: true, element: summarizeNode(element), effects: getEffectsOnCurrentlySelectedElement()});
	}
	chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
		if(msg.contentScriptId !== contentScriptId){
			return;
		}
		if(msg.stopContentScript){
			console.log(`bye from content script ${contentScriptId}`)
		}else if(msg.findSelectors){
			var result = findSelectors(msg.req);
			sendResponse(result)
		}else if(msg.executeAction){
			executeAction(msg.action);
			sendResponse({});
		}else if(msg.executeRule){
			executeRule(msg.ruleId);
			sendResponse({});
		}else if(msg.currentRules){
			setCurrentRules(msg.currentRules);
			sendResponse(getEffectsOnCurrentlySelectedElement())
		}else if(msg.requestEffects){
			sendResponse(getEffectsOnCurrentlySelectedElement())
		}else if(msg.requestExecutionStates){
			sendResponse(getExecutionStates());
		}
	});
	chrome.runtime.sendMessage(undefined, {contentScriptLoaded: true, contentScriptId: contentScriptId}, resp => {
		setCurrentRules(resp.currentRules);
	});
})();
