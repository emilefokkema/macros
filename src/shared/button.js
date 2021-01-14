import { macros } from './macros';
import { Event, CancellationToken } from './events';
import { buttonInteraction } from './button-interaction';
import { storage } from './storage';

class ButtonNotification{
    constructor(navigation, {numberOfRules, numberOfRulesThatHaveSomethingToDo}){
        this.navigation = navigation;
        this.numberOfRules = numberOfRules;
        this.numberOfRulesThatHaveSomethingToDo = numberOfRulesThatHaveSomethingToDo;
        this.disappeared = new Event();
        this.updated = new Event();
        this.initialize();
    }
    initialize(){
        this.navigation.disappeared.next().then(() => {
            this.disappear();
        });
    }
    update({numberOfRules, numberOfRulesThatHaveSomethingToDo}){
        this.numberOfRules = numberOfRules;
        this.numberOfRulesThatHaveSomethingToDo = numberOfRulesThatHaveSomethingToDo;
        if(this.numberOfRules === 0){
            this.disappear();
        }else{
            this.updated.dispatch();
        }
    }
    disappear(){
        this.disappeared.dispatch();
    }
    toJSON(){
        return {
            navigationId: this.navigation.id,
            numberOfRules: this.numberOfRules,
            numberOfRulesThatHaveSomethingToDo: this.numberOfRulesThatHaveSomethingToDo
        };
    }
    static create(navigation, {numberOfRules, numberOfRulesThatHaveSomethingToDo}){
        if(numberOfRules === 0){
            return null;
        }
        return new ButtonNotification(navigation, {numberOfRules, numberOfRulesThatHaveSomethingToDo});
    }
    static async recreate({navigationId, numberOfRules}){
        var navigation = await macros.navigation.getNavigation(navigationId);
        if(!navigation){
            console.log(`could not recreate notification for navigation '${navigationId}'`)
            return null;
        }
        var notification = new ButtonNotification(navigation, {numberOfRules});
        return notification;
    }
}

class Button{
    constructor(tabId, notifications){
        this.tabId = tabId;
        this.notifications = notifications || [];
        this.disappeared = new Event();
        this.cancellationToken = new CancellationToken();
    }
    addNotification(navigation, info){
        var notification = this.notifications.find(n => n.navigation.id === navigation.id);
        if(!notification){
            notification = ButtonNotification.create(navigation, info);//new ButtonNotification(navigation, info);
            if(!notification){
                return;
            }
            this.notifications.push(notification);
            notification.disappeared.next(this.cancellationToken).then(() => {
                this.removeNotification(notification);
            });
            notification.updated.listen(() => {
                this.update();
            }, this.cancellationToken);
        }else{
            notification.update(info);
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
        var numberOfRulesThatHaveSomethingToDo = this.notifications.map(n => n.numberOfRulesThatHaveSomethingToDo).reduce((a, b) => a + b, 0);
        if(numberOfRulesThatHaveSomethingToDo > 0){
            buttonInteraction.setBadgeText({tabId: this.tabId, text: `${numberOfRulesThatHaveSomethingToDo}`});
            buttonInteraction.setBadgeBackgroundColor({tabId: this.tabId, color: '#007bff'});
        }else if(numberOfRules > 0){
            buttonInteraction.setBadgeText({tabId: this.tabId, text: `${numberOfRules}`});
            buttonInteraction.setBadgeBackgroundColor({tabId: this.tabId, color: '#6c757d'});
        }
    }
    toJSON(){
        return {
            tabId: this.tabId,
            notifications: this.notifications
        };
    }
    static create(navigation, notificationInfo){
        var notification = ButtonNotification.create(navigation, notificationInfo);
        if(notification === null){
            return null;
        }
        var button = new Button(navigation.tabId);
        button.addNotification(navigation, notificationInfo);
        return button;
    }
    static async recreate({tabId, notifications}){
        var notifications = (await Promise.all(notifications.map(n => ButtonNotification.recreate(n)))).filter(n => !!n);
        if(notifications.length === 0){
            return null;
        }
        var button = new Button(tabId, notifications);
        button.update();
        return button;
    }
}

class ButtonCollection{
    constructor(){
        this.loaded = false;
        this.buttons = [];
    }
    async ensureLoaded(){
        if(this.loaded){
            return;
        }
        var stringifiedButtons = storage.getItem('buttons') || [];
        console.log(`going to recreate buttons:`, stringifiedButtons);
        this.buttons = (await Promise.all(stringifiedButtons.map(b => Button.recreate(b)))).filter(n => !!n);
        this.save();
        console.log(`button collection loaded ${this.buttons.length} buttons:`, JSON.parse(JSON.stringify(this.buttons)))
        this.loaded = true;
    }
    async addNotification({navigationId, ...info}){
        await this.ensureLoaded();
        var navigation = await macros.navigation.getNavigation(navigationId);
        if(!navigation){
            console.warn(`could not find navigation '${navigationId}'`);
            return;
        }
        var button = this.buttons.find(b => b.tabId === navigation.tabId);
        if(!button){
            button = Button.create(navigation, info);
            if(button === null){
                return;
            }
            this.buttons.push(button);
            button.disappeared.next().then(() => {
                this.removeButton(button);
            });
        }else{
            button.addNotification(navigation, info);
        }
        
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