import { macros } from './macros';
import { Event, CancellationToken } from './events'

class Button{
    constructor(tabId){
        this.tabId = tabId;
        this.numberOfRules = 0;
        this.numberOfRulesWithSomethingToDo = 0;
        this.numberOfRulesThatHaveExecuted = 0;
        this.numberOfNavigations = 0;
        this.disappeared = new Event();
        this.cancellationToken = new CancellationToken();
    }
    addNumberOfRules(navigation, {numberOfRules}){
        console.log(`adding ${numberOfRules} to button on tab ${this.tabId}`);
        navigation.disappeared.listen(() => {
            console.log(`a navigation that had ${numberOfRules} rules for tab ${this.tabId} has now disappeared`);
        });
    }
}

class ButtonCollection{
    constructor(){
        this.buttons = [];
    }
    async setNumberOfRules({navigationId, numberOfRules}){
        var navigation = await macros.navigation.getNavigation(navigationId);
        var button = this.buttons.find(b => b.tabId === navigation.tabId);
        if(!button){
            button = new Button(navigation.tabId);
            this.buttons.push(button);
            button.disappeared.when(() => true).then(() => {
                this.removeButton(button);
            });
        }
        button.addNumberOfRules(navigation, {numberOfRules});
    }
    removeButton(button){
        var index = this.buttons.indexOf(button);
        if(index > -1){
            this.buttons.splice(index, 1);
        }
    }
}

var buttons = new ButtonCollection();

export { buttons };