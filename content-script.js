(async function(){
	function cssPropertyValueIsLessThan(actual, expected){
		var parsedActual = parseFloat(actual);
		var parsedExpected = parseFloat(expected);
		return !isNaN(parsedActual) && !isNaN(parsedExpected) && parsedActual < parsedExpected;
	}
	function cssPropertyValueIsGreaterThan(actual, expected){
		var parsedActual = parseFloat(actual);
		var parsedExpected = parseFloat(expected);
		return !isNaN(parsedActual) && !isNaN(parsedExpected) && parsedActual > parsedExpected;
	}
	function styleDeclarationContainsProperty(declaration, property){
		for(var i = 0; i < declaration.length; i++){
			if(declaration[i] === property){
				return true;
			}
		}
		return false;
	}
	function comparisonSucceeds(actual, comparison, expected){
		switch(comparison){
			case "eq": return actual === expected;
			case "lt": return cssPropertyValueIsLessThan(actual, expected);
			case "gt": return cssPropertyValueIsGreaterThan(actual, expected);
		}
	}
	function matchRestriction(declaration, restriction){
		if(!styleDeclarationContainsProperty(declaration, restriction.property)){
			return null;
		}
		var value = declaration.getPropertyValue(restriction.property);
		if(!comparisonSucceeds(value, restriction.comparison, restriction.value)){
			return null;
		}
		return {value: value};
	}
	function matchStyleDeclaration(declaration, req){
		var matches = [];
		for(var restriction of req.properties){
			var restrictionMatch = matchRestriction(declaration, restriction);
			if(!restrictionMatch){
				return null;
			}
			matches.push({property: restriction.property, value: restrictionMatch.value});
		}
		return matches;
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
		}catch(e){
			console.log(`skipping css style sheet:`, e)
		}
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
	function* findMatches(req){
		for(var rule of findCssRules()){
			var valueMatches = matchStyleDeclaration(rule.style, req);
			if(!valueMatches){
				continue;
			}
			var nodes = document.querySelectorAll(rule.selectorText);
			if(nodes.length === 0){
				continue;
			}
			yield {
				selector: rule.selectorText,
				css: rule.cssText,
				values: valueMatches,
				nodes: nodes
			}
		}
	}
	var contentScriptId = +new Date() - Math.floor(Math.random() * 1000);
	console.log(`hello from content script ${contentScriptId}`)
	chrome.runtime.onMessage.addListener((msg, sender) => {
		if(msg.contentScriptId !== contentScriptId){
			return;
		}
		if(msg.stopContentScript){
			console.log(`bye from content script ${contentScriptId}`)
		}else if(msg.findClass){
			console.log(`got request to find class`, msg.req);
			var result = [...findMatches(msg.req)];
			console.log(result)
		}
	});
	chrome.runtime.sendMessage(undefined, {contentScriptLoaded: true, contentScriptId: contentScriptId});
})();
