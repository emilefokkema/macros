!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define([],t):"object"==typeof exports?exports.management=t():e.management=t()}(this,(function(){return(()=>{"use strict";var e={912:(e,t,s)=>{s.r(t);var n={createEditorUrl(e,t){var s=new URLSearchParams;e&&s.append("navigationId",e),t&&s.append("ruleId",t);const n=`create-rule.html?${s}`;var a=new URLSearchParams;return a.append("page",n),`sandbox.html?${a}`},getParamsFromHref(e){var t=new URL(e),s=t.searchParams.get("navigationId"),n=t.searchParams.get("ruleId");return{navigationId:s||void 0,ruleId:n?parseInt(n):void 0}},replaceParamsInHref(e,t,s){var n=new URL(e);return n.searchParams.delete("navigationId"),t&&n.searchParams.append("navigationId",t),n.searchParams.delete("ruleId"),s&&n.searchParams.append("ruleId",s),n.toString()}};const a={DELETE_ACTION_TYPE:"delete",REMOVE_CLASS_ACTION_TYPE:"removeClass",REMOVE_STYLE_PROPERTY_ACTION_TYPE:"removeStyleProperty",SELECT_ACTION_TYPE:"select",getDeleteActionDefinition(){return{type:this.DELETE_ACTION_TYPE}},getRemoveClassActionDefinition(e){return{type:this.REMOVE_CLASS_ACTION_TYPE,class:e}},getRemoveStylePropertyActionDefinition(e){return{type:this.REMOVE_STYLE_PROPERTY_ACTION_TYPE,property:e}},getSelectActionDefinition(e,t){return t||(t=this.getDeleteActionDefinition()),{type:this.SELECT_ACTION_TYPE,selector:e,action:t}},getSelectActionActionDefinitionOfType(e){switch(e){case this.DELETE_ACTION_TYPE:return this.getDeleteActionDefinition();case this.REMOVE_CLASS_ACTION_TYPE:return this.getRemoveClassActionDefinition();case this.REMOVE_STYLE_PROPERTY_ACTION_TYPE:return this.getRemoveStylePropertyActionDefinition()}},nodeActionsAreEqual(e,t){if(!e)return!t;if(!t)return!1;if(e.type!==t.type)return!1;switch(e.type){case this.DELETE_ACTION_TYPE:return!0;case this.REMOVE_CLASS_ACTION_TYPE:return e.class===t.class;case this.REMOVE_STYLE_PROPERTY_ACTION_TYPE:return e.property===t.property}},selectActionsAreEqual(e,t){return e.selector===t.selector&&this.nodeActionsAreEqual(e.action,t.action)},actionsAreEqual(e,t){if(!e)return!t;if(!t)return!1;if(e.type!==t.type)return!1;switch(e.type){case this.SELECT_ACTION_TYPE:return this.selectActionsAreEqual(e,t)}return!1},actionIsAchievedByOther(e,t){if(e.type!==t.type)return!1;switch(e.type){case this.DELETE_ACTION_TYPE:return!0;case this.REMOVE_CLASS_ACTION_TYPE:return e.class===t.class;case this.REMOVE_STYLE_PROPERTY_ACTION_TYPE:return e.property===t.property}},rulesAreEqual(e,t){if(!e)return!t;if(!t)return!1;if(e.name!==t.name||e.urlPattern!==t.urlPattern||e.automatic!==t.automatic)return!1;if(e.actions){if(!t.actions)return!1;if(e.actions.length!==t.actions.length)return!1;for(let s=0;s<e.actions.length;s++)if(!this.actionsAreEqual(e.actions[s],t.actions[s]))return!1;return!0}return!t.actions}};class i{constructor(){this.promise=new Promise(((e,t)=>{this.resolve=e,this.reject=t}))}}class r{listen(e,t){this.addListener(e);var s=()=>this.removeListener(e);return t&&t.onCancelled(s),{cancel:s}}filter(e){return new d(this,e)}map(e){return new l(this,e)}mapAsync(e){return new u(this,e)}compare(e){return new o(this,e)}when(e,t){var s,n=new Promise((e=>{s=e})),a=this.listen((function(){var t=[].slice.apply(arguments);e.apply(null,t)&&(a.cancel(),s(t))}),t);return n}next(e){return this.when((()=>!0),e)}debounce(e){return new p(this,e)}}class o extends r{constructor(e,t){super(),this.source=e,this.getInitialArgs=t}listen(e,t){var s=this.getInitialArgs();return this.source.listen((function(){var t=Array.prototype.slice.apply(arguments),n=e(s,t);return s=t,n}),t)}}class u extends r{constructor(e,t){super(),this.eventSource=e,this.mapAsync=t}listen(e,t){var s=this;return this.eventSource.listen((function(){var t=Array.prototype.slice.apply(arguments);s.mapAsync(...t).then((t=>{t?e(...t):e()}))}),t)}}class g extends r{constructor(e){super(),this.eventSource=e}listen(e,t){var s=this;return this.eventSource.listen((function(){var t=Array.prototype.slice.apply(arguments),n=s.map(...t);return e(...n)}),t)}}class c extends r{constructor(e){super(),this.eventSource=e}listen(e,t){var s=this;return this.eventSource.listen((function(){var t=Array.prototype.slice.apply(arguments);if(s.filter(...t))return e(...t)}),t)}}class d extends c{constructor(e,t){super(e),this.filter=t}}class l extends g{constructor(e,t){super(e),this.map=t}}class h extends r{constructor(){super(),this.listeners=[]}addListener(e){this.listeners.push(e)}removeListener(e){var t=this.listeners.indexOf(e);t>-1&&this.listeners.splice(t,1)}dispatch(){var e=Array.prototype.slice.apply(arguments);for(let t of this.listeners.slice())t(...e)}}class p extends h{constructor(e,t){super(),this.originalEventSource=e,this.interval=t,this.currentTimeout=void 0,this.subscription=void 0,this.latestArgs=void 0,this.waiting=!1}addListener(e){super.addListener(e),this.start()}removeListener(e){super.removeListener(e),0===this.listeners.length&&this.stop()}renewTimeout(){void 0!==this.currentTimeout&&clearTimeout(this.currentTimeout),this.currentTimeout=setTimeout((()=>{this.dispatch(...this.latestArgs),this.waiting=!1,this.currentTimeout=void 0}),this.interval),this.waiting=!0}start(){this.subscription=this.originalEventSource.listen(((...e)=>{this.latestArgs=e,this.renewTimeout()}))}stop(){void 0!==this.currentTimeout&&clearTimeout(this.currentTimeout),this.subscription&&this.subscription.cancel()}}class R{constructor(e){this.type=e}filterMessage(e){return e.type===this.type}unpackMessage(e){return e.message}packMessage(e){return{type:this.type,message:e}}toString(){return this.type}}class M{onMessage(e,t){return{cancel(){}}}nextMessage(e){var t=new i,s=this.onMessage((e=>{s.cancel(),t.resolve(e)}),e);return t.promise}ofType(e){return new f(this,e)}}class v{async sendMessageAsync(e){}sendMessage(e){}ofType(e){return new m(this,e)}}class f extends M{constructor(e,t){super(),this.messagesSource=e,this.messageType=t}onMessage(e,t){return this.messagesSource.onMessage(((t,s)=>{if(this.messageType.filterMessage(t))return e(this.messageType.unpackMessage(t),s)}),t)}}class m extends v{constructor(e,t){super(),this.messagesTarget=e,this.messageType=t}sendMessage(e){this.messagesTarget.sendMessage(this.messageType.packMessage(e))}sendMessageAsync(e){return this.messagesTarget.sendMessageAsync(this.messageType.packMessage(e))}}class T extends M{constructor(e,t){super(),this.sourceWindow=e,this.messagesEventSource=t.filter((t=>t.source===e&&t.data&&"message"===t.data.type)).map((e=>[e.data.message,t=>this.sendResponseToMessage(e.data.messageId,t)]))}sendResponseToMessage(e,t){this.sourceWindow.postMessage({type:"response",messageId:e,response:t},"*")}onMessage(e,t){return this.messagesEventSource.listen(e,t)}}class y{constructor(e){this.messageId=e,this.promise=new Promise((e=>{this.resolve=e}))}}class S extends v{constructor(e,t){super(),this.latestMessageId=0,this.messageResponsePromises=[],this.targetWindow=e,t.filter((t=>t.source===e&&t.data&&"response"===t.data.type)).listen((e=>this.resolveResponsePromise(e.data.messageId,e.data.response)))}resolveResponsePromise(e,t){const s=this.messageResponsePromises.findIndex((t=>t.messageId===e));if(-1===s)return;const[n]=this.messageResponsePromises.splice(s,1);n.resolve(t)}async sendMessageAsync(e){const t=++this.latestMessageId,s=new y(t);return this.messageResponsePromises.push(s),this.targetWindow.postMessage({type:"message",messageId:t,message:e},"*"),s.promise}sendMessage(e){const t=++this.latestMessageId;this.targetWindow.postMessage({type:"message",messageId:t,message:e},"*")}}class I{constructor(e,t){this.source=e,this.target=t}}class E extends M{constructor(e,t){super(),this.source=t.ofType(e)}onMessage(e,t){return this.source.onMessage(e,t)}}class w extends v{constructor(e,t){super(),this.target=t.ofType(e)}sendMessageAsync(e){return this.target.sendMessageAsync(e)}sendMessage(e){this.target.sendMessage(e)}}class A{constructor(e,t){this.messagesSource=e,this.messagesTarget=t}createChannel(e){const t=new E(e,this.messagesSource),s=new w(e,this.messagesTarget);return new I(t,s)}static create(e,t){const s=new T(e,t),n=new S(e,t);return new A(s,n)}}class C{constructor(e){this.type=e}filterMessage(e){return"messageBusMessage"===e.type&&e.subType===this.type}unpackMessage(e){return e.message}packMessage(e){return{type:"messageBusMessage",subType:this.type,message:e}}toString(){return`messageBus:${this.type}`}}class q extends M{constructor(e,t,s){super(),this.type=e,this.iframeChannelSource=t,this.channelSubscriptionMessageTarget=s}onMessage(e,t){return this.channelSubscriptionMessageTarget.sendMessage({messageType:this.type,sendsResponse:2===e.length}),this.iframeChannelSource.onMessage(e,t)}}class N extends v{constructor(e,t,s){super(),this.type=e,this.targetInitializationMessageTarget=s,this.iframeChannelTarget=t,this.targetInitialized=!1}async ensureInitialized(e){this.targetInitialized||(await this.targetInitializationMessageTarget.sendMessageAsync({messageType:this.type,expectsResponse:e}),this.targetInitialized=!0)}async sendMessageAsync(e){return await this.ensureInitialized(!0),await this.iframeChannelTarget.sendMessageAsync(e)}sendMessage(e){this.ensureInitialized(!1).then((()=>{this.iframeChannelTarget.sendMessage(e)}))}}class b{constructor(e,t){this.source=e,this.target=t}}class x{constructor(e,t,s){this.iframeMessageBus=e,this.targetInitializationMessageTarget=t,this.channelSubscriptionMessageTarget=s}createChannel(e){const t=this.iframeMessageBus.createChannel(new C(e)),s=new q(e,t.source,this.channelSubscriptionMessageTarget),n=new N(e,t.target,this.targetInitializationMessageTarget);return new b(s,n)}}function P(e,t,s){s?e.source.onMessage((async(e,s)=>{s(await t.target.sendMessageAsync(e))})):e.source.onMessage((e=>{t.target.sendMessage(e)}))}class D{static initializeForParent(e,t,s,n){s.onMessage((({messageType:t,sendsResponse:s})=>{const a=e.createChannel(new C(t));P(n.createChannel(t),a,s)})),t.onMessage((({messageType:t,expectsResponse:s},a)=>{P(e.createChannel(new C(t)),n.createChannel(t),s),a()}))}static createForIframe(e,t,s){return new x(e,t,s)}}class F{constructor(e,t,s,n,a,i){this.id=e,this.historyId=t,this.url=s,this.tabId=n,this.frameId=a,this.focusNavigationMessageTarget=i}focus(){this.focusNavigationMessageTarget.sendMessage(this.id)}}class L{constructor(e,t,s,n,a,i,r){this.navigationDisappearedMessageSource=e,this.navigationExistsMessageTarget=t,this.navigationPropsRequestTarget=s,this.focusNavigationMessageTarget=n,this.popupTabIdMessageTarget=a,this.navigationsForPopupMessageTarget=i,this.openTabMessageTarget=r}openTab(e){this.openTabMessageTarget.sendMessage(e)}getNavigationsForPopup(){return this.navigationsForPopupMessageTarget.sendMessageAsync()}getPopupTabId(){return this.popupTabIdMessageTarget.sendMessageAsync()}navigationExists(e){return this.navigationExistsMessageTarget.sendMessageAsync(e)}onDisappeared(e,t){return this.navigationDisappearedMessageSource.onMessage(e,t)}whenDisappeared(e){return new Promise((t=>{const s=this.navigationDisappearedMessageSource.onMessage((async()=>{await this.navigationExists(e)||(s.cancel(),t())}))}))}async getNavigation(e){if(!await this.navigationExists(e))return null;const{id:t,historyId:s,url:n,tabId:a,frameId:i}=await this.navigationPropsRequestTarget.sendMessageAsync(e);return new F(t,s,n,a,i,this.focusNavigationMessageTarget)}}class _{constructor(){this.watching=!1,this.inputHasHappened=!1,this.whenInputHappenedPromise=void 0}watch(){this.watching||(this.whenInputHappenedPromise=new Promise((e=>{const t=()=>{this.inputHasHappened=!0,e(),removeEventListener("input",t)};addEventListener("input",t)})),this.watching=!0)}async whenInputHasHappened(){this.inputHasHappened||(this.watch(),await this.whenInputHappenedPromise)}}class O{constructor(e,t,s,n,a,i){this.documentTitleMessageTarget=e,this.historyStateMessageTarget=t,this.closeWindowMessageTarget=s,this.unsavedChangesWarningEnabledMessageTarget=n,this.downloadJsonMessageTarget=a,this.copyToClipboardMessageTarget=i,this.unsavedChangesWarningEnabled=!1,this.windowInputWatcher=new _,this.windowInputWatcher.watch()}getLocation(){return window.location.href}close(){this.closeWindowMessageTarget.sendMessage({})}downloadJson(e,t){this.downloadJsonMessageTarget.sendMessage({object:e,fileName:t})}copyToClipboard(e){return this.copyToClipboardMessageTarget.sendMessageAsync({text:e})}setUnsavedChangedWarningEnabled(e){e!==this.unsavedChangesWarningEnabled&&(this.unsavedChangesWarningEnabled=e,e?this.windowInputWatcher.whenInputHasHappened().then((()=>{this.unsavedChangesWarningEnabled&&this.unsavedChangesWarningEnabledMessageTarget.sendMessage({enabled:!0})})):this.unsavedChangesWarningEnabledMessageTarget.sendMessage({enabled:!1}))}async pushHistoryState(e){history.pushState("",{},e),await this.historyStateMessageTarget.sendMessageAsync(e)}setTitle(e){document.title=e,this.documentTitleMessageTarget.sendMessage(e)}}class W{constructor(e){this.inspectedWindowTabIdMessageTarget=e}getTabId(){return this.inspectedWindowTabIdMessageTarget.sendMessageAsync()}}class U{constructor(){const e=new h;this.firstInvocationAfterObserve=!0,this.observer=new ResizeObserver((()=>{this.firstInvocationAfterObserve?this.firstInvocationAfterObserve=!1:e.dispatch()})),this.debouncedResize=e.debounce(100)}start(){this.firstInvocationAfterObserve=!0,this.observer.observe(document.body)}stop(){this.observer.disconnect()}}class B{constructor(e){this.documentTitleChannel=e.createChannel(new R("documentTitle")),this.bodySizeChannel=e.createChannel(new R("bodySize")),this.messageBusChannelSubscriptionMessage=e.createChannel(new R("messageBusChannelSubscription")),this.messageBusIntializeTargetRequest=e.createChannel(new R("initializeTargetRequest")),this.navigationDisappearedMessage=e.createChannel(new R("navigationDisappeared")),this.navigationExistsRequest=e.createChannel(new R("navigationExists")),this.getNavigationPropertiesRequest=e.createChannel(new R("navigationPropertiesRequest")),this.pushHistoryStateMessage=e.createChannel(new R("pushHistoryState")),this.focusNavigationMessage=e.createChannel(new R("focusNavigation")),this.popupTabIdMessage=e.createChannel(new R("getPopupTabId")),this.getNavigationsForPopupMessage=e.createChannel(new R("getNavigationsForPopup")),this.openTabMessage=e.createChannel(new R("openTab")),this.inspectedWindowTabIdMessage=e.createChannel(new R("inspectedWindowTabId")),this.closeWindowMessage=e.createChannel(new R("closeWindow")),this.unsavedChangesWarningEnabledMessage=e.createChannel(new R("unsavedChangesWarningEnabled")),this.copyToClipboardMessage=e.createChannel(new R("copyToClipboard")),this.downloadJsonMessage=e.createChannel(new R("downloadJson")),this.windowMessageBus=e}}class H extends B{constructor(e,t){super(e),D.initializeForParent(this.windowMessageBus,this.messageBusIntializeTargetRequest.source,this.messageBusChannelSubscriptionMessage.source,t)}onDocumentTitleChanged(e,t){return this.documentTitleChannel.source.onMessage(e,t)}onWindowCloseRequested(e,t){return this.closeWindowMessage.source.onMessage(e,t)}onUnsavedChangesWarningEnabled(e,t){return this.unsavedChangesWarningEnabledMessage.source.onMessage(e,t)}onCopyToClipboardMessage(e,t){return this.copyToClipboardMessage.source.onMessage(e,t)}setNavigationDisappeared(e){e.listen((()=>{this.navigationDisappearedMessage.target.sendMessage()}))}onRequestToDownloadJson(e,t){return this.downloadJsonMessage.source.onMessage(e,t)}onRequestNavigationExists(e,t){return this.navigationExistsRequest.source.onMessage(e,t)}onRequestNavigationProperties(e,t){return this.getNavigationPropertiesRequest.source.onMessage(e,t)}onRequestToPushHistoryState(e,t){return this.pushHistoryStateMessage.source.onMessage(e,t)}onRequestToFocusNavigation(e,t){return this.focusNavigationMessage.source.onMessage(e,t)}onRequestNavigationsForPopup(e,t){return this.getNavigationsForPopupMessage.source.onMessage(e,t)}onRequestPopupTabId(e,t){return this.popupTabIdMessage.source.onMessage(e,t)}onBodySizeChange(e,t){return this.bodySizeChannel.source.onMessage(e,t)}onRequestToOpenTab(e,t){return this.openTabMessage.source.onMessage(e,t)}onRequestInspectedWindowTabId(e,t){return this.inspectedWindowTabIdMessage.source.onMessage(e,t)}}class z extends B{constructor(e){super(e),this.setDocumentTitle(document.title),async function(){document&&document.body||await new Promise((e=>{const t=()=>{document&&document.body&&(removeEventListener("load",t),e())};addEventListener("load",t)}))}().then((async()=>{const e=new U;for(;;)await this.setBodySize(),e.start(),await e.debouncedResize.next(),e.stop()}))}setDocumentTitle(e){this.documentTitleChannel.target.sendMessage(e)}setBodySize(){return this.bodySizeChannel.target.sendMessageAsync({width:document.body.scrollWidth,height:document.body.scrollHeight})}getMessageBus(){return D.createForIframe(this.windowMessageBus,this.messageBusIntializeTargetRequest.target,this.messageBusChannelSubscriptionMessage.target)}getNavigationInterface(){const e=this.navigationDisappearedMessage.source,t=this.navigationExistsRequest.target,s=this.getNavigationPropertiesRequest.target,n=this.focusNavigationMessage.target,a=this.popupTabIdMessage.target,i=this.getNavigationsForPopupMessage.target,r=this.openTabMessage.target;return new L(e,t,s,n,a,i,r)}getPageInterface(){const e=this.documentTitleChannel.target,t=this.pushHistoryStateMessage.target,s=this.closeWindowMessage.target,n=this.unsavedChangesWarningEnabledMessage.target,a=this.downloadJsonMessage.target,i=this.copyToClipboardMessage.target;return new O(e,t,s,n,a,i)}getInspectedWindow(){const e=this.inspectedWindowTabIdMessage.target;return new W(e)}}const Y=class{static createForParent(e,t,s){const n=A.create(e,t);return new H(n,s)}static createForIframe(e,t){const s=A.create(e,t);return new z(s)}}.createForIframe(parent,new class extends r{addListener(e){window.addEventListener("message",e)}removeListener(e){window.removeEventListener("message",e)}}),k=Y.getMessageBus(),J=Y.getNavigationInterface(),j=Y.getPageInterface(),$=Y.getInspectedWindow(),V=new class{constructor(e,t,s,i){this.navigation=e,this.inspectedWindow=t,this.editors=n,this.ruleDefinitions=a,this.page=i,this.rulesForUrlRequest=s.createChannel("requestRulesForUrl"),this.rulesForDownloadRequest=s.createChannel("requestRulesForDownload"),this.urlWithEncodedRuleRequest=s.createChannel("urlWithEncodedRuleRequest"),this.rulesJsonUploadRequest=s.createChannel("uploadRulesJson"),this.rulesForNavigationNotification=s.createChannel("notifyRulesForNavigation"),this.executeRuleMessage=s.createChannel("executeRule"),this.openEditorRequest=s.createChannel("openEditor"),this.ruleByIdRequest=s.createChannel("requestRuleById"),this.allRulesRequest=s.createChannel("requestAllRules"),this.executeActionRequest=s.createChannel("executeAction"),this.editedStatusRequest=s.createChannel("requestEditedStatus"),this.editableStatusRequest=s.createChannel("requestEditableStatus"),this.editorLoadedMessage=s.createChannel("editorLoaded"),this.editedStatusChangedMessage=s.createChannel("editedStatusChanged"),this.saveRuleRequest=s.createChannel("requestSaveRule"),this.deleteRuleRequest=s.createChannel("requestDeleteRule"),this.ruleAddedNotification=s.createChannel("notifyRuleAdded"),this.ruleDeletedNotification=s.createChannel("notifyRuleDeleted"),this.ruleUpdatedNotification=s.createChannel("notifyRuleUpdated"),this.addActionRequest=s.createChannel("requestToAddAction"),this.addSelectActionRequest=s.createChannel("requestToAddSelectAction"),this.addSelectActionToEditorRequest=s.createChannel("requestToAddSelectActionToEditor"),this.getSelectedElementInDevtoolsRequest=s.createChannel("getSelectedElementInDevtoolsRequest"),this.selectedElementInDevtoolsNotification=s.createChannel("selectedElementInDevtoolsNotification"),this.suggestionIndicationStartNotification=s.createChannel("suggestionIndicationStart"),this.suggestionIndicationEndNotification=s.createChannel("suggestionIndicationEnd"),this.executeSuggestionRequest=s.createChannel("executeSuggestion"),this.markSuggestionAsRemovedRequest=s.createChannel("markSuggestionAsRemoved"),this.undoSuggestionRequest=s.createChannel("undoSuggestion"),this.addSuggestionToRuleRequest=s.createChannel("addSuggestionToRuleRequest"),this.addSuggestionToNewRuleRequest=s.createChannel("addSuggestionToNewRuleRequest"),this.getAndRemoveSuggestionRequest=s.createChannel("getAndRemoveSuggestion"),this.getRuleStatesForNavigationRequest=s.createChannel("getRuleStatesForNavigation"),this.ruleStateForNavigationChangeNotification=s.createChannel("ruleStateForNavigationChangeNotification"),this.ruleStateForNavigationRemovedNotification=s.createChannel("ruleStateForNavigationRemovedNotification"),this.getSuggestionsRequest=s.createChannel("getSuggestions"),this.reloadSuggestionsRequest=s.createChannel("reloadSuggestions"),this.newDraftRuleForNavigationRequest=s.createChannel("newDraftRuleForNavigationRequest"),this.draftRuleCreatedNotification=s.createChannel("draftRuleCreatedNotification"),this.draftRulesRemovedNotification=s.createChannel("draftRulesRemovedNotification"),this.draftRuleForNavigationRequest=s.createChannel("draftRuleForNavigationRequest"),this.draftRuleStateForNavigationRequest=s.createChannel("draftRuleStateForNavigationRequest"),this.draftRuleStateForNavigationNotification=s.createChannel("draftRuleStateForNavigationNotification"),this.draftRuleChangedNotification=s.createChannel("draftRuleChangedNotification"),this.executeDraftRuleRequest=s.createChannel("executeDraftRuleRequest")}getRulesForUrl(e){return this.rulesForUrlRequest.target.sendMessageAsync(e)}getRuleById(e){return this.ruleByIdRequest.target.sendMessageAsync(e)}getRulesForDownload(e){return this.rulesForDownloadRequest.target.sendMessageAsync({ruleIds:e})}onGetRulesForDownloadRequest(e,t){return this.rulesForDownloadRequest.source.onMessage(e,t)}getUrlWithEncodedRule(e,t){return this.urlWithEncodedRuleRequest.target.sendMessageAsync({ruleId:e,navigationId:t})}onUrlWithEncodedRuleRequest(e,t){return this.urlWithEncodedRuleRequest.source.onMessage(e,t)}uploadRulesJson(e){return this.rulesJsonUploadRequest.target.sendMessageAsync({jsonString:e})}onUploadRulesJson(e,t){return this.rulesJsonUploadRequest.source.onMessage(e,t)}getAllRules(){return this.allRulesRequest.target.sendMessageAsync({})}onGetRuleByIdRequest(e,t){return this.ruleByIdRequest.source.onMessage(e,t)}onGetAllRulesRequest(e,t){return this.allRulesRequest.source.onMessage(e,t)}onRequestRulesForUrl(e,t){return this.rulesForUrlRequest.source.onMessage(e,t)}notifyRulesForNavigation(e){this.rulesForNavigationNotification.target.sendMessage(e)}onNotifyRulesForNavigation(e,t){return this.rulesForNavigationNotification.source.onMessage(e,t)}executeRuleAsync(e,t){return this.executeRuleMessage.target.sendMessageAsync({navigationId:e,ruleId:t})}onExecuteRuleRequest(e,t){return this.executeRuleMessage.source.onMessage(e,t)}executeActionAsync(e,t){return this.executeActionRequest.target.sendMessageAsync({navigationId:e,action:t})}onExecuteActionRequest(e,t){return this.executeActionRequest.source.onMessage(e,t)}onRequestToOpenEditor(e,t){return this.openEditorRequest.source.onMessage(e,t)}requestToOpenEditor({navigationId:e,ruleId:t}){return this.openEditorRequest.target.sendMessageAsync({navigationId:e,ruleId:t})}openManagementPage(){var e=new URLSearchParams;e.append("page","management.html"),this.navigation.openTab(`sandbox.html?${e}`)}getEditableStatus(e,t){return this.editableStatusRequest.target.sendMessageAsync({ruleId:e,navigationId:t})}onGetEditableStatusRequest(e,t){return this.editableStatusRequest.source.onMessage(e,t)}getEditedStatusAsync(e){return this.editedStatusRequest.target.sendMessageAsync({ruleId:e})}onEditedStatusChanged(e,t){return this.editedStatusChangedMessage.source.onMessage(e,t)}notifyEditedStatusChanged(e){this.editedStatusChangedMessage.target.sendMessage(e)}onEditedStatusRequest(e,t){return this.editedStatusRequest.source.onMessage(e,t)}onEditorLoaded(e,t){return this.editorLoadedMessage.source.onMessageFromNavigation(e,t)}notifyEditorLoaded(e){this.editorLoadedMessage.target.sendMessage(e)}saveRuleAsync(e){return this.saveRuleRequest.target.sendMessageAsync(e)}onSaveRuleRequest(e,t){return this.saveRuleRequest.source.onMessage(e,t)}deleteRuleAsync(e){return this.deleteRuleRequest.target.sendMessageAsync(e)}onDeleteRuleRequest(e,t){return this.deleteRuleRequest.source.onMessage(e,t)}notifyRuleAdded(){this.ruleAddedNotification.target.sendMessage({})}onRuleAdded(e,t){return this.ruleAddedNotification.source.onMessage(e,t)}notifyRuleDeleted(e){this.ruleDeletedNotification.target.sendMessage(e)}onRuleDeleted(e,t){return this.ruleDeletedNotification.source.onMessage(e,t)}notifyRuleUpdated(e){this.ruleUpdatedNotification.target.sendMessage(e)}onRuleUpdated(e,t){return this.ruleUpdatedNotification.source.onMessage(e,t)}requestToAddAction(e){this.addActionRequest.target.sendMessage(e)}onRequestToAddAction(e,t){return this.addActionRequest.source.onMessage(e,t)}addSelectAction(e,t,s){this.addSelectActionRequest.target.sendMessage({navigationId:e,selectorText:t,ruleId:s})}onRequestToAddSelectAction(e,t){return this.addSelectActionRequest.source.onMessage(e,t)}addSelectActionToEditor(e,t,s){this.addSelectActionToEditorRequest.target.sendMessage({navigationId:e,ruleId:t,selectorText:s})}onRequestToAddSelectActionToEditor(e,t){return this.addSelectActionToEditorRequest.source.onMessage(e,t)}getSelectedElementInDevtools(e){return this.getSelectedElementInDevtoolsRequest.target.sendMessageAsync({tabId:e})}onGetSelectedElementInDevtoolsRequest(e,t){return this.getSelectedElementInDevtoolsRequest.source.onMessage(e,t)}notifySelectedElementInDevtools(e){this.selectedElementInDevtoolsNotification.target.sendMessage(e)}onSelectedElementInDevtoolsChange(e,t){return this.selectedElementInDevtoolsNotification.source.onMessage(e,t)}notifySuggestionIndicationStart(e,t){this.suggestionIndicationStartNotification.target.sendMessage({navigationId:e,suggestionId:t})}onNotifySuggestionIndicationStart(e,t){return this.suggestionIndicationStartNotification.source.onMessage(e,t)}notifySuggestionIndicationEnd(e,t){this.suggestionIndicationEndNotification.target.sendMessage({navigationId:e,suggestionId:t})}onNotifySuggestionIndicationEnd(e,t){return this.suggestionIndicationEndNotification.source.onMessage(e,t)}onExecuteSuggestionRequest(e,t){return this.executeSuggestionRequest.source.onMessage(e,t)}executeSuggestion(e,t){return this.executeSuggestionRequest.target.sendMessageAsync({suggestionId:t,navigationId:e})}markSuggestionAsRemoved(e,t){return this.markSuggestionAsRemovedRequest.target.sendMessageAsync({navigationId:e,suggestionId:t})}onMarkSuggestionAsRemoved(e,t){return this.markSuggestionAsRemovedRequest.source.onMessage(e,t)}onUndoSuggestionRequest(e,t){return this.undoSuggestionRequest.source.onMessage(e,t)}undoSuggestion(e,t){return this.undoSuggestionRequest.target.sendMessageAsync({suggestionId:t,navigationId:e})}onAddSuggestionToRuleRequest(e,t){return this.addSuggestionToRuleRequest.source.onMessage(e,t)}requestToAddSuggestionToRule(e,t,s){this.addSuggestionToRuleRequest.target.sendMessage({ruleId:e,navigationId:t,suggestionId:s})}onAddSuggestionToNewRuleRequest(e,t){return this.addSuggestionToNewRuleRequest.source.onMessage(e,t)}requestToAddSuggestionToNewRule(e,t){this.addSuggestionToNewRuleRequest.target.sendMessage({navigationId:e,suggestionId:t})}onGetAndRemoveSuggestionRequest(e,t){return this.getAndRemoveSuggestionRequest.source.onMessage(e,t)}getSuggestions(e){return this.getSuggestionsRequest.target.sendMessageAsync({navigationId:e})}onGetSuggestionsRequest(e,t){return this.getSuggestionsRequest.source.onMessage(e,t)}reloadSuggestions(e){return this.reloadSuggestionsRequest.target.sendMessageAsync({navigationId:e})}onReloadSuggestionsRequest(e,t){return this.reloadSuggestionsRequest.source.onMessage(e,t)}getAndRemoveSuggestion(e,t){return this.getAndRemoveSuggestionRequest.target.sendMessageAsync({suggestionId:e,navigationId:t})}getRuleStatesForNavigation(e){return this.getRuleStatesForNavigationRequest.target.sendMessageAsync({navigationId:e})}onGetRuleStatesForNavigation(e,t){return this.getRuleStatesForNavigationRequest.source.onMessage(e,t)}notifyRuleStateForNavigationChanged(e,t){this.ruleStateForNavigationChangeNotification.target.sendMessage({navigationId:e,state:t})}onRuleStateForNavigationChanged(e,t){return this.ruleStateForNavigationChangeNotification.source.onMessage(e,t)}notifyRuleStateForNavigationRemoved(e,t){this.ruleStateForNavigationRemovedNotification.target.sendMessage({navigationId:e,ruleId:t})}onRuleStateForNavigationRemoved(e,t){return this.ruleStateForNavigationRemovedNotification.source.onMessage(e,t)}createNewDraftRuleForNavigation(e){return this.newDraftRuleForNavigationRequest.target.sendMessageAsync({navigationId:e})}onRequestToCreateNewDraftRuleForNavigation(e,t){return this.newDraftRuleForNavigationRequest.source.onMessage(e,t)}getDraftRuleForNavigation(e){return this.draftRuleForNavigationRequest.target.sendMessageAsync({navigationId:e})}onRequestDraftRuleForNavigation(e,t){return this.draftRuleForNavigationRequest.source.onMessage(e,t)}notifyDraftRuleCreated(e,t){this.draftRuleCreatedNotification.target.sendMessage({navigationId:e,draftRule:t})}onDraftRuleCreated(e,t){return this.draftRuleCreatedNotification.source.onMessage(e,t)}notifyDraftRulesRemoved(e){this.draftRulesRemovedNotification.target.sendMessage(e)}onDraftRulesRemoved(e,t){return this.draftRulesRemovedNotification.source.onMessage(e,t)}getDraftRuleStateForNavigation(e){return this.draftRuleStateForNavigationRequest.target.sendMessageAsync({navigationId:e})}onDraftRuleStateForNavigationRequest(e,t){return this.draftRuleStateForNavigationRequest.source.onMessage(e,t)}notifyDraftRuleStateForNavigation(e,t){this.draftRuleStateForNavigationNotification.target.sendMessage({navigationId:e,draftRuleState:t})}onDraftRuleStateForNavigation(e,t){return this.draftRuleStateForNavigationNotification.source.onMessage(e,t)}onRequestToExecuteDraftRule(e,t){return this.executeDraftRuleRequest.source.onMessage(e,t)}executeDraftRule(e){return this.executeDraftRuleRequest.target.sendMessageAsync({navigationId:e})}onDraftRuleChanged(e,t){return this.draftRuleChangedNotification.source.onMessage(e,t)}notifyDraftRuleChanged(e,t){this.draftRuleChangedNotification.target.sendMessage({navigationId:e,draftRule:t})}}(J,$,k,j);class G{constructor(){this.selectedRules=[],this.selectionExists=!1,this.selectionHasExisted=!1}getSelectedRules(){return this.selectedRules.slice()}ruleIsSelected(e){return this.selectedRules.some((t=>t===e))}selectRules(e){for(let t of e)this.selectedRules.includes(t)||this.selectedRules.push(t);this.selectedRules.length>0&&(this.selectionExists=!0,this.selectionHasExisted=!0)}clear(){this.selectedRules.splice(0,this.selectedRules.length),this.selectionExists=!1}selectRule(e,t){const s=this.selectedRules.findIndex((t=>t===e));t&&-1===s?(this.selectedRules.push(e),this.selectionExists=!0,this.selectionHasExisted=!0):!t&&s>-1&&(this.selectedRules.splice(s,1),0===this.selectedRules.length&&(this.selectionExists=!1))}}new Vue({el:"#app",data:function(){return{rules:[],ruleIds:[],selection:new G,fileUploadError:void 0,fileUploadSuccessMessage:void 0}},mounted:function(){this.initialize()},computed:{selectionExists(){return this.selection.selectionExists},resultMessage(){return this.fileUploadError||this.fileUploadSuccessMessage}},provide(){return{selection:this.selection}},methods:{initialize:async function(){await this.refresh(),V.onRuleAdded((()=>this.refresh())),V.onRuleUpdated((()=>this.refresh()))},refresh:async function(){this.rules=await V.getAllRules(),this.ruleIds=this.rules.map((e=>e.id))},onDeleteRuleClicked:async function(e){confirm(`Are you sure you want to delete '${e.name}'?`)&&(await V.deleteRuleAsync(e.id),this.refresh())},onFileUploadError(e){this.fileUploadError=e},onFileUploadSuccess(e){this.fileUploadSuccessMessage=e},onResultMessageCloseClicked(){this.fileUploadError=void 0,this.fileUploadSuccessMessage=void 0}},components:{rule:{template:document.getElementById("ruleTemplate").innerHTML,props:{rule:Object},data:function(){return{deletable:!0}},mounted:function(){this.initialize()},methods:{async initialize(){var e=await V.getEditedStatusAsync(this.rule.id);this.deletable=!e.edited,V.onEditedStatusChanged((({ruleId:e,edited:t})=>{e===this.rule.id&&(this.deletable=!t)}))},onDeleteClicked:function(){this.$emit("deleteruleclicked")},onEditClicked:function(){V.requestToOpenEditor({ruleId:this.rule.id})}},components:{"rule-selector":{template:document.getElementById("ruleSelectorTemplate").innerHTML,props:{ruleId:Number},inject:["selection"],computed:{selected:{get(){return this.selection.ruleIsSelected(this.ruleId)},set(e){this.selection.selectRule(this.ruleId,e)}}}}}},"action-panel":{template:document.getElementById("actionPanelTemplate").innerHTML,inject:["selection"],data:()=>({uploadActive:!1}),computed:{selectionExists(){return this.selection.selectionExists}},methods:{async download(){const e=this.selection.getSelectedRules(),t=await V.getRulesForDownload(e);V.page.downloadJson(t,"rules.json")},onUploadClicked(){this.$refs.fileInput.click()},onFileInputChange(){const e=this.$refs.fileInput.files;if(1===e.length){const t=e[0],s=new FileReader;s.addEventListener("error",(()=>{console.log("error reading file"),this.$refs.fileInput.value=""})),s.addEventListener("load",(()=>{const e=s.result;this.$refs.fileInput.value="",V.uploadRulesJson(e).then((e=>{e.error?this.$emit("file-upload-error",e.error):this.$emit("file-upload-success","successfully uploaded")}))})),s.readAsText(t)}}}},"selection-actions":{template:document.getElementById("selectionActionsPanel").innerHTML,props:{ruleIds:Array},inject:["selection"],computed:{selectionExists(){return this.selection.selectionExists},hidden(){return this.selection.selectionHasExisted&&!this.selection.selectionExists}},methods:{selectAll(){this.selection.selectRules(this.ruleIds)},selectNone(){this.selection.clear()}}},"result-panel":{template:document.getElementById("resultPanelTemplate").innerHTML,props:{errorMessage:String,successMessage:String},computed:{isError(){return!!this.errorMessage},isSuccess(){return!!this.successMessage},message(){return this.errorMessage||this.successMessage}},methods:{closeClicked(){this.$emit("close")}}}}})}},t={};function s(n){if(t[n])return t[n].exports;var a=t[n]={exports:{}};return e[n](a,a.exports,s),a.exports}return s.r=e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},s(912)})()}));