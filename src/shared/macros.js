import { tabs } from './tabs';
import { runtimeMessagesTarget } from './runtime-messages';
import { MessageType } from './events';

var contentScriptLoaded = new MessageType('contentScriptLoaded');

class ContentScriptInterface{
	constructor(contentScriptId){
		console.log(`hello from content script ${contentScriptId}`)
	}
}

class ContentScriptOnTab{
	constructor(contentScriptId){

	}
}

class ContentScriptLoader{
	
	getInterface(){
		var contentScriptId = +new Date() - Math.floor(Math.random() * 1000);
		runtimeMessagesTarget.ofType(contentScriptLoaded).sendMessage({contentScriptId: contentScriptId});
		var contentScriptInterface = new ContentScriptInterface(contentScriptId);
		return contentScriptInterface;
	}
	async getOnTab(tab, cancellationToken){
		try{
			const [{contentScriptId}] = await Promise.all([
				tab.outgoingMessages.ofType(contentScriptLoaded).nextMessage(cancellationToken),
				tab.executeScriptAsync('content-script.js')
			])
			console.log(`loaded content script ${contentScriptId}`)
			return new ContentScriptOnTab(contentScriptId);
		}catch(e){
			console.log(`there was an error executing the script: `, e);
			return undefined;
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