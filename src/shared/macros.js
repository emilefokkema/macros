import { tabs } from './tabs';
import { runtimeMessages } from './runtime-messages';


class Macros{
	constructor(){
		this.tabs = tabs;
	}
	getContentScriptInterface(){
		console.log(`going to create content script interface`);
	}
	async getContentScriptOnTab(tab){
		try{
			var executeScriptPromise = tab.executeScriptAsync('content-script.js');
			await executeScriptPromise;
			
		}catch(e){
			console.log(`there was an error executing the script: `, e)
		}
	}
}

var macros = new Macros();

export {macros};