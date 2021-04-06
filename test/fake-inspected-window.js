export class FakeInspectedWindow{
    constructor(tabId){
        this._tabId = tabId || 0;
    }
    get tabId(){return this._tabId;}
    eval(){}
}