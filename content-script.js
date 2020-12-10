(async function(){
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
		execute(node, result){
			try{
				node.parentNode.removeChild(node);
			}catch(e){
				result.reportError(e);
			}
		}
	}
	class RemoveClassFromSelectedNodeAction{
		constructor(definition){
			this.class = definition.class;
		}
		getEffectOnNode(node){
			return `will remove class '${this.class}' from this element`;
		}
		execute(node, result){
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
	class SelectedNodeAction{
		static create(definition){
			switch(definition.type){
				case "delete": return new DeleteSelectedNodeAction(definition);
				case "removeClass": return new RemoveClassFromSelectedNodeAction(definition);
			}
		}
	}
	class SelectAction{
		constructor(definition){
			this.selector = definition.selector;
			this.action = SelectedNodeAction.create(definition.action)
		}
		getEffectOnNode(node){
			if(!node.matches(this.selector)){
				return null;
			}
			return this.action.getEffectOnNode(node);
		}
		execute(result){
			try{
				var nodes = document.querySelectorAll(this.selector);
				if(nodes.length === 0){
					return;
				}
				for(var i = 0; i < nodes.length; i++){
					this.action.execute(nodes[i], result);
				}
			}catch(e){
				result.reportError(e);
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
	class Rule{
		constructor(definition){
			this.name = definition.name;
			this.actions = definition.actions.map(d => Action.create(d));
		}
		getEffectOnNode(node){
			if(!node){
				return [];
			}
			return this.actions.map(a => a.getEffectOnNode(node)).filter(a => !!a);
		}
	}
	class ActionExecutionResult{
		constructor(){
			this.error = undefined;
		}
		reportError(e){
			this.error = e.message;
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
		var result = new ActionExecutionResult();
		var action = Action.create(actionDefinition);
		action.execute(result);
		return result;
	}
	var contentScriptId = +new Date() - Math.floor(Math.random() * 1000);
	var currentRules = [];
	var currentlySelectedElement = undefined;
	function setCurrentRules(rules){
		currentRules = rules.map(r => ({
			ruleId: r.ruleId,
			rule: new Rule(r.rule)
		}))
		//console.log(`current rules: `, currentRules)
	}
	function getEffectsOnCurrentlySelectedElement(){
		return currentRules.map(r => ({
			ruleId: r.ruleId,
			effect: r.rule.getEffectOnNode(currentlySelectedElement)
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
		//console.log(`content script received message`, msg)
		if(msg.stopContentScript){
			console.log(`bye from content script ${contentScriptId}`)
		}else if(msg.findSelectors){
			var result = findSelectors(msg.req);
			sendResponse(result)
		}else if(msg.executeAction){
			var result = executeAction(msg.action);
			sendResponse(result);
		}else if(msg.currentRules){
			setCurrentRules(msg.currentRules);
			sendResponse(getEffectsOnCurrentlySelectedElement())
		}else if(msg.requestEffects){
			//console.log(`effects were requested`)
			sendResponse(getEffectsOnCurrentlySelectedElement())
		}
	});
	chrome.runtime.sendMessage(undefined, {contentScriptLoaded: true, contentScriptId: contentScriptId}, resp => {
		setCurrentRules(resp.currentRules);
	});
})();
