import { tabs } from './tabs';
import { runtimeMessagesTarget } from './runtime-messages';
import { MessageType } from './events';

var contentScriptLoaded = new MessageType('contentScriptLoaded');

class ContentScriptLoader{
	
	getInterface(){
		var contentScriptId = +new Date() - Math.floor(Math.random() * 1000);
		runtimeMessagesTarget.ofType(contentScriptLoaded).sendMessage({contentScriptId: contentScriptId});
	}
	async getOnTab(tab){
		try{
			const [{contentScriptId}] = await Promise.all([
				tab.outgoingMessages.ofType(contentScriptLoaded).nextMessage(),
				tab.executeScriptAsync('content-script.js')
			])
			console.log(`content script was loaded: `, contentScriptId);
		}catch(e){
			console.log(`there was an error executing the script: `, e)
		}
		
	}
}

class Macros{
	constructor(){
		this.tabs = tabs;
		this.contentScripts = new ContentScriptLoader();
	}
}

var macros = new Macros();

export {macros};