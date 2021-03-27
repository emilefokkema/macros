import { Event } from '../src/shared/events';

export class FakeNavigationInterface{
    constructor(){
        this.navigationHasDisappeared = new Event();
        this.navigationHasBeenReplaced = new Event();
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
    onCreated(){

    }
    onReplaced(listener, cancellationToken){
        return this.navigationHasBeenReplaced.listen(listener, cancellationToken);
    }
    onDisappeared(listener, cancellationToken){
        return this.navigationHasDisappeared.listen(listener, cancellationToken);
    }
    whenDisappeared(){
        
    }
}