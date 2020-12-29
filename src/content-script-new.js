import { macros } from './shared/macros';

var currentlySelectedElement;

var elementSelectedInDevtools = function(element){
	currentlySelectedElement = element;
}

var load = async function(){
	var contentScriptInterface = await macros.contentScripts.getInterface();
	var pageId = await contentScriptInterface.getPageId();
	console.log(`got page id: `, pageId);
	var rules = await contentScriptInterface.getRulesForPage(pageId);
	console.log(`got rules: `, rules)
};

load();


export {elementSelectedInDevtools};