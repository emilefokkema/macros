export class InspectedWindowForSandbox{
    constructor(inspectedWindowTabIdMessageTarget){
        this.inspectedWindowTabIdMessageTarget = inspectedWindowTabIdMessageTarget;
    }
    getTabId(){
        return this.inspectedWindowTabIdMessageTarget.sendMessageAsync();
    }
}