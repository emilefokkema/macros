import { Event } from '../shared/events';

export class BodyResizeObserver{
    constructor(){
        const resizeEvent = new Event();
        this.firstInvocationAfterObserve = true;
        this.observer = new ResizeObserver(() => {
            if(this.firstInvocationAfterObserve){
                this.firstInvocationAfterObserve = false;
                return;
            }
            resizeEvent.dispatch();
        });
        this.debouncedResize = resizeEvent.debounce(100);
    }
    start(){
        this.firstInvocationAfterObserve = true;
        this.observer.observe(document.body);
    }
    stop(){
        this.observer.disconnect();
    }
}