import { tabs } from './tabs';
import { runtimeMessagesTarget, runtimeMessagesSource } from './runtime-messages';
import { MessageType, Event, MessagesSourceAndTarget } from './events';

class ContentScriptMessageType{
	constructor(type, contentScriptId){
		this.type = type;
		this.contentScriptId = contentScriptId;
	}
	filterMessage(msg){
		return msg.type === this.type && msg.contentScriptId === this.contentScriptId;
	}
	packMessage(msg){
		return {
			type: this.type,
			contentScriptId: this.contentScriptId,
			message: msg
		};
	}
	unpackMessage(msg){
		return msg.message;
	}
}

class RequestFromContentScript{
	constructor(type, contentScriptId){
		this.messageType = new ContentScriptMessageType(type, contentScriptId);
		this.messagesTarget = runtimeMessagesTarget.ofType(this.messageType);
	}
	sendAsync(req){
		return this.messagesTarget.sendMessageAsync(req);
	}
	onRequestFromTab(tab, listener, cancellationToken){
		return tab.outgoingMessages.ofType(this.messageType).onMessage(listener, cancellationToken);
	}
}

class ContentScriptInterfaceEvent{
	constructor(type, contentScriptId){
		this.messageType = new ContentScriptMessageType(type, contentScriptId);
		this.messagesSource = runtimeMessagesSource.ofType(this.messageType);
	}
	dispatchToTab(tab, event){
		tab.incomingMessages.ofType(this.messageType).sendMessage(event);
	}
}

class TabEvent{
	constructor(messageType){
		this.messageType = messageType;
	}
	dispatch(event){
		runtimeMessagesTarget.ofType(this.messageType).sendMessage(event);
	}
	fromTab(tab){
		return tab.outgoingMessages.ofType(this.messageType);
	}
}

var contentScriptLoaded = new TabEvent(new MessageType('contentScriptLoaded'));

class ContentScript{
	constructor(contentScriptId){
		this.contentScriptId = contentScriptId;
		this.acknowledgeContentScript = new ContentScriptInterfaceEvent('acknowledgeContentScript', contentScriptId);
		this.pageIdRequest = new RequestFromContentScript('getPageId', contentScriptId);
		this.pageRulesRequest = new RequestFromContentScript('getRulesForPage', contentScriptId);
	}
}

class ContentScriptInterface extends ContentScript {
	constructor(contentScriptId){
		super(contentScriptId);
		console.log(`hello from content script ${contentScriptId}`)
	}
	whenAcknowledged(){
		return this.acknowledgeContentScript.messagesSource.nextMessage();
	}
	getPageId(){
		return this.pageIdRequest.sendAsync({});
	}
	getRulesForPage(pageId){
		return this.pageRulesRequest.sendAsync(pageId);
	}
}

class ContentScriptOnTab extends ContentScript{
	constructor(tab, contentScriptId){
		super(contentScriptId);
		this.tab = tab;
		this.discarded = new Event();
	}
	onPageIdRequest(listener, cancellationToken){
		return this.pageIdRequest.onRequestFromTab(this.tab, listener, cancellationToken);
	}
	onPageRuleRequest(listener, cancellationToken){
		return this.pageRulesRequest.onRequestFromTab(this.tab, listener, cancellationToken);
	}
	acknowledge(){
		this.acknowledgeContentScript.dispatchToTab(this.tab, {});
	}
	discard(){
		this.discarded.dispatch();
	}
}

class ContentScriptLoader{
	constructor(){
		this.contentScriptsOnTabs = [];
		this.pageRuleRequest = new MessagesSourceAndTarget();
	}
	
	async getInterface(){
		var contentScriptId = +new Date() - Math.floor(Math.random() * 1000);
		contentScriptLoaded.dispatch({contentScriptId: contentScriptId})
		var contentScriptInterface = new ContentScriptInterface(contentScriptId);
		await contentScriptInterface.whenAcknowledged();
		console.log(`content script has been acknowledged`);
		return contentScriptInterface;
	}
	async getOnTab(tab, cancellationToken){
		try{
			const [{contentScriptId}] = await Promise.all([
				contentScriptLoaded.fromTab(tab).nextMessage(cancellationToken),
				tab.executeScriptAsync('content-script.js')
			])
			console.log(`loaded content script ${contentScriptId}`)
			var result = new ContentScriptOnTab(tab, contentScriptId);
			this.addContentScriptOnTab(result);
			return result;
		}catch(e){
			console.log(`there was an error executing the script: `, e);
			return undefined;
		}
	}
	addContentScriptOnTab(contentScriptOnTab){
		this.contentScriptsOnTabs.push(contentScriptOnTab);
		contentScriptOnTab.onPageRuleRequest((pageId, sendResponse) => {
			this.pageRuleRequest.target.sendMessageAsync(pageId).then(rules => sendResponse(rules));
			return true;
		});
		contentScriptOnTab.discarded.listen(() => this.removeContentScriptOnTab(contentScriptOnTab));
	}
	removeContentScriptOnTab(contentScriptOnTab){
		var index = this.contentScriptsOnTabs.indexOf(contentScriptOnTab);
		if(index > -1){
			this.contentScriptsOnTabs.splice(index, 1);
			console.log(`removed content script on tab. Current number of content scripts: ${this.contentScriptsOnTabs.length}`);
		}
	}
}

class Macros{
	constructor(){
		this.tabs = tabs;
		this.pageRuleRequest = new MessagesSourceAndTarget();
		this.contentScripts = new ContentScriptLoader();
		this.contentScripts.pageRuleRequest.source.onMessage((pageId, sendResponse) => {
			this.pageRuleRequest.target.sendMessageAsync(pageId).then(rules => sendResponse(rules));
			return true;
		});
	}
	onPageRuleRequest(listener){
		this.pageRuleRequest.source.onMessage(listener);
	}
}

var macros = new Macros();

export {macros};