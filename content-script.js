(async function(){
	function styleDeclarationMatches(declaration, req){
		var value = declaration.getPropertyValue(req.property);
		return value === req.value;
	}
	function* findClassInSheet(sheet, req){
		try{
			var rules = sheet.cssRules;
			for(var i = 0; i < rules.length; i++){
				var rule = rules[i];
				if(rule.type !== CSSRule.STYLE_RULE){
					continue;
				}
				if(styleDeclarationMatches(rule.style, req)){
					yield rule.selectorText;
				}
			}
		}catch(e){
			console.log(`skipping css style sheet:`, e)
		}
	}
	function* findClass(req){
		var sheets = document.styleSheets;
		for(var i = 0; i < sheets.length; i++){
			var sheet = sheets[i];
			if(sheet.disabled || sheet.type !== "text/css"){
				continue;
			}
			yield* findClassInSheet(sheets[i], req);
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
			//var result = [...findClass(msg.req)];
			//console.log(result)
		}
	});
	chrome.runtime.sendMessage(undefined, {contentScriptLoaded: true, contentScriptId: contentScriptId});
})();
