export class WindowInputWatcher{
    constructor(){
        this.watching = false;
        this.inputHasHappened = false;
        this.whenInputHappenedPromise = undefined;
    }
    watch(){
        if(this.watching){
            return;
        }
        this.whenInputHappenedPromise = new Promise((res) => {
            const listener = () => {
                this.inputHasHappened = true;
                res();
                removeEventListener('input',listener);
            };
            addEventListener('input', listener);
        });
        this.watching = true;
    }
    async whenInputHasHappened(){
        if(this.inputHasHappened){
            return;
        }
        this.watch();
        await this.whenInputHappenedPromise;
    }
}