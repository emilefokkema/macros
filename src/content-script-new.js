import { macros } from './shared/macros';

var currentlySelectedElement;

var elementSelectedInDevtools = function(element){
	currentlySelectedElement = element;
}

var load = async function(){
	var url = location.href;
	console.log(`hello from content script on url ${url}`)
	macros.notifyContentScriptForUrl(url);
};

load();


export {elementSelectedInDevtools};