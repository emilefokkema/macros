import { tabs } from './tabs';
import { MessageType } from './events';
import { runtimeMessagesEventSource, runtimeMessagesTarget } from './runtime-messages';
import { crossBoundaryEventFactory } from './cross-boundary-events';

class PageIdRequest{
	constructor(){
		this.messageType = new MessageType('pageIdRequest');
		this.source = runtimeMessagesEventSource.filter((msg) => this.messageType.filterMessage(msg)).map((msg, sender, sendResponse) => [{tabId: sender.tab && sender.tab.id}, sendResponse]);
		this.target = runtimeMessagesTarget.ofType(this.messageType);
	}

}

class Macros{
	constructor(){
		this.tabs = tabs;
		this.pageIdRequest = new PageIdRequest();
		this.pageRuleRequest = crossBoundaryEventFactory.create('requestRulesForPage');
		this.rulesChanged = crossBoundaryEventFactory.create('rulesChanged');
	}
	getPageId(){
		return this.pageIdRequest.target.sendMessageAsync();
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
	onPageIdRequest(listener, cancellationToken){
		return this.pageIdRequest.source.listen(listener, cancellationToken);
	}
}

var macros = new Macros();

export {macros};