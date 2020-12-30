import { tabs } from './tabs';
import { MessageType } from './events';
import { runtimeMessagesEventSource, runtimeMessagesTarget } from './runtime-messages';
import { crossBoundaryEventFactory } from './cross-boundary-events';

class PageIdRequest{
	constructor(){
		this.messageType = new MessageType('pageIdForContentScriptRequest');
		this.source = runtimeMessagesEventSource.filter((msg) => this.messageType.filterMessage(msg)).map((msg, sender, sendResponse) => [{tabId: sender.tab && sender.tab.id}, sendResponse]);
		this.target = runtimeMessagesTarget.ofType(this.messageType);
	}

}

class Macros{
	constructor(){
		this.tabs = tabs;
		this.pageIdForContentScriptRequest = new PageIdRequest();
		this.pageIdForTabIdRequest = crossBoundaryEventFactory.create('requestPageIdForTabId');
		this.pageRuleRequest = crossBoundaryEventFactory.create('requestRulesForPage');
		this.rulesChanged = crossBoundaryEventFactory.create('rulesChanged');
	}
	getPageIdForContentScript(){
		return this.pageIdForContentScriptRequest.target.sendMessageAsync();
	}
	async getPageIdForPopup(){
		var tabId = await this.tabs.getTabIdWherePopupWasClicked();
		return this.pageIdForTabIdRequest.target.sendMessageAsync(tabId);
	}
	getRulesForPage(pageId){
		return this.pageRuleRequest.target.sendMessageAsync(pageId);
	}
	onRulesChanged(listener){
		return this.rulesChanged.source.onMessage(listener);
	}
	onPageRuleRequest(listener, cancellationToken){
		return this.pageRuleRequest.source.onMessage(listener, cancellationToken);
	}
	onPageIdForContentScriptRequest(listener, cancellationToken){
		return this.pageIdForContentScriptRequest.source.listen(listener, cancellationToken);
	}
	onPageIdForTabIdRequest(listener, cancellationToken){
		return this.pageIdForTabIdRequest.source.onMessage(listener, cancellationToken);
	}
}

var macros = new Macros();

export {macros};