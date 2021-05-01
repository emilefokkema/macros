import { TabMessagesTarget } from './tab-messages-target';

export class TabMessagesTargetFactory{
    createTarget(tabId){
        return new TabMessagesTarget(tabId);
    }
}