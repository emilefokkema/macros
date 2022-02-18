export class UnsavedChangesWarning{
    constructor(){
        this.enabled = false;
        this.onbeforeunloadListener = (e) => {
            e.preventDefault();
            e.returnValue = '';
        };
    }
    enable(){
        if(this.enabled){
            return;
        }
        addEventListener('beforeunload', this.onbeforeunloadListener);
        this.enabled = true;
    }
    disable(){
        if(!this.enabled){
            return;
        }
        removeEventListener('beforeunload', this.onbeforeunloadListener);
        this.enabled = false;
    }
}