import { tabs } from './tabs';
import { runtimeMessagesTarget, runtimeMessagesSource } from './runtime-messages';
import { MessageType, Event } from './events';

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
		this.pageRulesChanged = new ContentScriptInterfaceEvent('pageRulesChanged', contentScriptId);
		this.pageRulesRequest = new RequestFromContentScript('getPageRules', contentScriptId);
		this.pageIdRequest = new RequestFromContentScript('getPageId', contentScriptId);
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
	onRulesChanged(listener, cancellationToken){
		this.pageRulesRequest.sendAsync({}).then(rules => {
			if(cancellationToken && cancellationToken.cancelled){
				return;
			}
			listener(rules);
		});
		return this.pageRulesChanged.messagesSource.onMessage(listener, cancellationToken);
	}
}

class ContentScriptOnTab extends ContentScript{
	constructor(tab, contentScriptId){
		super(contentScriptId);
		this.tab = tab;
	}
	onPageIdRequest(listener, cancellationToken){
		return this.pageIdRequest.onRequestFromTab(this.tab, listener, cancellationToken);
	}
	onPageRulesRequest(listener, cancellationToken){
		this.pageRulesRequest.onRequestFromTab(this.tab, listener, cancellationToken);
	}
	acknowledge(){
		this.acknowledgeContentScript.dispatchToTab(this.tab, {});
	}
	setRules(rules){
		this.pageRulesChanged.dispatchToTab(this.tab, rules);
	}
}

class ContentScriptLoader{
	
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
			return new ContentScriptOnTab(tab, contentScriptId);
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
		this.rulesChanged = new Event();
	}
	onRuleAdded(){
		this.rulesChanged.dispatch();
	}
	onRuleDeleted(){
		this.rulesChanged.dispatch();
	}
	onRuleUpdated(){
		this.rulesChanged.dispatch();
	}
	setRuleCollection(ruleCollection){
		ruleCollection.ruleUpdated.listen(() => this.onRuleUpdated());
		ruleCollection.ruleAdded.listen(() => this.onRuleAdded());
		ruleCollection.ruleDeleted.listen(() => this.onRuleDeleted());
	}
}

var macros = new Macros();

export {macros};