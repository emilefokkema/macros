import { macros } from './macros';

async function getTabIdForNavigation(navigationId){

}

class Button{
    constructor(tabId){
        this.tabId = tabId;
        this.numberOfRules = 0;
        this.numberOfRulesWithSomethingToDo = 0;
        this.numberOfRulesThatHaveExecuted = 0;
    }
    setNumberOfRules({numberOfRules}){
        
    }
}

class ButtonCollection{
    constructor(){
        this.buttons = [];
    }
    async setNumberOfRules({navigationId, numberOfRules}){
        var tabId = await macros.navigation.getTabIdForNavigation(navigationId);

        console.log(`navigation on tab ${tabId} has ${numberOfRules} rules`)
    }
}

var buttons = new ButtonCollection();

export { buttons };