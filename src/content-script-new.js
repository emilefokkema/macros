import { macros } from './shared/macros';

var currentlySelectedElement;

var elementSelectedInDevtools = function(element){
	currentlySelectedElement = element;
}

var load = async function(){
	var url = location.href;
	var rules = await macros.getRulesForUrl(url);
	console.log(`hello from content script on url ${url} with rules`, rules)
	
};

load();


export {elementSelectedInDevtools};