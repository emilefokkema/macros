import { Event } from '../src/shared/events';

export class FakeNavigationInterface{
    constructor(){
        this.navigationHasDisappeared = new Event();
    }

    getCurrent(){

    }
    openTab(){

    }
    async navigationExists(){
        return true;
    }
    async getNavigation(){

    }
    async getPopupTabId(){

    }
    async getAllForTab(){

    }
    async getAll(){

    }
    onCreated(){

    }
    onReplaced(){

    }
    onDisappeared(listener, cancellationToken){
        return this.navigationHasDisappeared.listen(listener, cancellationToken);
    }
    whenDisappeared(){
        
    }
}