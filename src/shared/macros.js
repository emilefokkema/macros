import { tabs } from './tabs';
import { runtimeMessages } from './runtime-messages';
import { MessageType, MessagesOfType} from './events';

class Macros{
	constructor(){
		this.tabs = tabs;
	}
	getContentScriptInterface(){
		var contentScriptId = +new Date() - Math.floor(Math.random() * 1000);
		var contentScriptLoaded = new MessagesOfType(runtimeMessages, new MessageType('contentScriptLoaded'));
		contentScriptLoaded.sendMessageAsync({contentScriptId: contentScriptId});
	}
	async getContentScriptOnTab(tab){
		var contentScriptLoaded = new MessagesOfType(tab.outgoingMessages, new MessageType('contentScriptLoaded'));
		contentScriptLoaded.onMessage((msg) => {
			console.log(`content script loaded message received:`, msg)
		});
		try{
			var executeScriptPromise = tab.executeScriptAsync('content-script.js');

			await executeScriptPromise;
			console.log(`content script was executed`);
		}catch(e){
			console.log(`there was an error executing the script: `, e)
		}
	}
}

var macros = new Macros();

export {macros};