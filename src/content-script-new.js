import { macros } from './shared/macros';

var currentlySelectedElement;

var elementSelectedInDevtools = function(element){
	currentlySelectedElement = element;
}

var load = async function(){
	var contentScriptInterface = await macros.contentScripts.getInterface();
	var pageInfo = await contentScriptInterface.getPageInfo();
	console.log(`got page info: `, pageInfo);
};

load();


export {elementSelectedInDevtools};