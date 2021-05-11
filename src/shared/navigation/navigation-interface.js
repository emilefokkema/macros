import { MessageType } from '../events';
import { getNavigationId, getNavigationHistoryId} from './navigation-ids';
import { Navigation } from './navigation';

const getCurrentNavigationMessageType = new MessageType('getCurrentNavigation');

function getNavigationReplacedMessage(crossBoundaryEventFactory){
    return crossBoundaryEventFactory.createChannel('navigationReplaced');
}

export class NavigationInterface{
    constructor(runtimeMessagesTarget, navigationReplacedMessage, navigationEventProvider, tabCollection){
        this.getCurrentNavigationMessageTarget = runtimeMessagesTarget.ofType(getCurrentNavigationMessageType);
        this.navigationReplacedMessage = navigationReplacedMessage;
        this.navigationEventProvider = navigationEventProvider;
        this.tabCollection = tabCollection;
    }
    static createForBackground(crossBoundaryEventFactory, runtimeMessagesEventSource, navigationEventProvider, runtimeMessagesTarget, tabCollection){
        const navigationReplacedMessage = getNavigationReplacedMessage(crossBoundaryEventFactory);
        navigationEventProvider.navigationReplaced.listen(({navigationHistoryId, newNavigationId}) => {
            navigationReplacedMessage.target.sendMessage({navigationHistoryId, newNavigationId});
        });
        runtimeMessagesEventSource.filter((msg, sender) => !!sender.tab && sender.tab.id > 0 && getCurrentNavigationMessageType.filterMessage(msg)).listen((msg, sender, sendResponse) => {
            sendResponse({
                id: getNavigationId(sender.tab.id, sender.frameId, sender.url),
                historyId: getNavigationHistoryId(sender.tab.id, sender.frameId),
                tabId: sender.tab.id
            })
        });
        return new NavigationInterface(runtimeMessagesTarget, navigationReplacedMessage, navigationEventProvider, tabCollection);
    }
    static create(crossBoundaryEventFactory, runtimeMessagesTarget, navigationEventProvider, tabCollection){
        const navigationReplacedMessage = getNavigationReplacedMessage(crossBoundaryEventFactory);
        return new NavigationInterface(runtimeMessagesTarget, navigationReplacedMessage, navigationEventProvider, tabCollection);
    }
    getCurrent(){
        return this.getCurrentNavigationMessageTarget.sendMessageAsync({});
    }
    openTab(url){
        this.tabCollection.openTab(url);
    }
    async navigationExists(navigationId){
        const tabs = await this.tabCollection.getAllTabs();
        for(let tab of tabs){
            if(getNavigationId(tab.id, 0, tab.url) === navigationId){
                return true;
            }
        }
        return await new Promise(async (resolve) => {
            let found = false;
            await Promise.all(tabs.map(async tab => {
                const frames = await this.tabCollection.getAllFramesInTab(tab.id);
                if(found || !frames){
                    return;
                }
                for(let frame of frames){
                    if(getNavigationId(tab.id, frame.frameId, frame.url) === navigationId){
                        found = true;
                        resolve(true);
                        break;
                    }
                }
            }));
            if(!found){
                resolve(false);
            }
        });
    }
    async getNavigation(navigationId){
        const tabs = await this.tabCollection.getAllTabs();
        for(let tab of tabs){
            if(getNavigationId(tab.id, 0, tab.url) === navigationId){
                return new Navigation(tab.id, 0, tab.url);
            }
        }
        return await new Promise(async (resolve) => {
            let found = false;
            await Promise.all(tabs.map(async tab => {
                const frames = await this.tabCollection.getAllFramesInTab(tab.id);
                if(found || !frames){
                    return;
                }
                for(let frame of frames){
                    if(getNavigationId(tab.id, frame.frameId, frame.url) === navigationId){
                        found = true;
                        resolve(new Navigation(tab.id, frame.frameId, frame.url));
                        break;
                    }
                }
            }));
            if(!found){
                resolve(null);
            }
        });
    }
    getPopupTabId(){
        return this.tabCollection.getPopupTabId();
    }
    onReplaced(listener, cancellationToken){
        return this.navigationReplacedMessage.source.onMessage(listener, cancellationToken);
    }
    onDisappeared(listener, cancellationToken){
        return this.navigationEventProvider.navigationDisappeared.listen(listener, cancellationToken);
    }
    whenDisappeared(navigationId){
        return this.navigationEventProvider.navigationDisappeared.mapAsync(async () => [await this.navigationExists(navigationId)]).filter(e => !e).next();
    }
}