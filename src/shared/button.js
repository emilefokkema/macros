import { macros } from './macros';
import { Event, CancellationToken } from './events';
import { buttonInteraction } from './button-interaction';
import { storage } from './storage';

class ButtonNotification{
    constructor(navigation, {numberOfRules}){
        this.navigation = navigation;
        this.numberOfRules = numberOfRules;
        this.disappeared = new Event();
        this.updated = new Event();
        this.initialize();
    }
    initialize(){
        this.navigation.disappeared.next().then(() => {
            this.disappear();
        });
    }
    update({numberOfRules}){
        this.numberOfRules = numberOfRules;
        this.updated.dispatch();
    }
    disappear(){
        this.disappeared.dispatch();
    }
    toJSON(){
        return {
            navigationId: this.navigation.id,
            numberOfRules: this.numberOfRules
        };
    }
}

class Button{
    constructor(tabId){
        this.tabId = tabId;
        this.notifications = [];
        this.disappeared = new Event();
        this.cancellationToken = new CancellationToken();
    }
    addNotification(navigation, {numberOfRules}){
        var notification = this.notifications.find(n => n.navigation.id === navigation.id);
        if(!notification){
            notification = new ButtonNotification(navigation, {numberOfRules});
            this.notifications.push(notification);
            notification.disappeared.next(this.cancellationToken).then(() => {
                this.removeNotification(notification);
            });
            notification.updated.listen(() => {
                this.update();
            }, this.cancellationToken);
        }else{
            notification.update({numberOfRules});
        }
        this.update();
    }
    removeNotification(notification){
        var index = this.notifications.indexOf(notification);
        if(index > -1){
            this.notifications.splice(index, 1);
            this.update();
        }
    }
    disappear(){
        this.cancellationToken.cancel();
        this.disappeared.dispatch();
    }
    update(){
        if(this.notifications.length === 0){
            this.disappear();
            return;
        }
        var numberOfRules = this.notifications.map(n => n.numberOfRules).reduce((a, b) => a + b, 0);
        if(numberOfRules > 0){
            buttonInteraction.setBadgeText({tabId: this.tabId, text: `${numberOfRules}`});
            buttonInteraction.setBadgeBackgroundColor({tabId: this.tabId, color: '#aaa'});
        }
    }
    toJSON(){
        return {
            tabId: this.tabId,
            notifications: this.notifications
        };
    }
}

class ButtonCollection{
    constructor(){
        this.buttons = [];
    }
    async addNotification({navigationId, numberOfRules}){
        var navigation = await macros.navigation.getNavigation(navigationId);
        var button = this.buttons.find(b => b.tabId === navigation.tabId);
        if(!button){
            button = new Button(navigation.tabId);
            this.buttons.push(button);
            button.disappeared.next().then(() => {
                this.removeButton(button);
            });
        }
        button.addNotification(navigation, {numberOfRules});
        this.save();
    }
    removeButton(button){
        var index = this.buttons.indexOf(button);
        if(index > -1){
            this.buttons.splice(index, 1);
            this.save();
        }
    }
    save(){
        storage.setItem('buttons', this.buttons);
    }
}

var buttons = new ButtonCollection();

export { buttons };