import { macros } from './shared/macros';

var currentlySelectedElement;

var elementSelectedInDevtools = function(element){
	currentlySelectedElement = element;
}

var load = async function(){
	var contentScriptInterface = macros.contentScripts.getInterface();
	
};

load();


export {elementSelectedInDevtools};