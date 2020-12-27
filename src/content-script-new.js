import { macros } from './shared/macros';

var currentlySelectedElement;

var elementSelectedInDevtools = function(element){
	currentlySelectedElement = element;
}

macros.contentScripts.getInterface();

export {elementSelectedInDevtools};