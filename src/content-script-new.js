import { macros } from './shared/macros';

var currentlySelectedElement;

var elementSelectedInDevtools = function(element){
	currentlySelectedElement = element;
}

var load = async function(){
	var pageId = await macros.getPageIdForContentScript();
	console.log(`got page id: `, pageId);
	var rules = await macros.getRulesForPage(pageId);
	console.log(`got rules: `, rules)
	macros.onRulesChanged(() => {
		console.log(`rules changed!`)
	});
};

load();


export {elementSelectedInDevtools};