export class FakeInspectedWindow{
    constructor(tabId){
        this._tabId = tabId || 0;
    }
    async getTabId(){return this._tabId;}
    eval(){}
}