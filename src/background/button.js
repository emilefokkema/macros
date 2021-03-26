import { Event, CancellationToken } from '../shared/events';

class ButtonNotification{
    constructor(navigationInterface, navigation, {numberOfRules, numberOfRulesThatHaveSomethingToDo, numberOfRulesThatHaveExecuted}){
        this.navigation = navigation;
        this.numberOfRules = numberOfRules;
        this.numberOfRulesThatHaveSomethingToDo = numberOfRulesThatHaveSomethingToDo;
        this.numberOfRulesThatHaveExecuted = numberOfRulesThatHaveExecuted;
        this.disappeared = new Event();
        this.updated = new Event();
        this.navigationInterface = navigationInterface;
    }
    update({numberOfRules, numberOfRulesThatHaveSomethingToDo, numberOfRulesThatHaveExecuted}){
        this.numberOfRules = numberOfRules;
        this.numberOfRulesThatHaveSomethingToDo = numberOfRulesThatHaveSomethingToDo;
        this.numberOfRulesThatHaveExecuted = numberOfRulesThatHaveExecuted;
        if(this.numberOfRules === 0){
            this.disappear();
        }else{
            this.updated.dispatch();
        }
    }
    exists(){
        return this.navigationInterface.navigationExists(this.navigation.id);
    }
    disappear(){
        this.disappeared.dispatch();
    }
    serialize(){
        return {
            navigationId: this.navigation.id,
            numberOfRules: this.numberOfRules,
            numberOfRulesThatHaveSomethingToDo: this.numberOfRulesThatHaveSomethingToDo,
            numberOfRulesThatHaveExecuted: this.numberOfRulesThatHaveExecuted
        };
    }
    static create(navigationInterface, navigation, {numberOfRules, ...rest}){
        if(numberOfRules === 0){
            return null;
        }
        return new ButtonNotification(navigationInterface, navigation, {numberOfRules, ...rest});
    }
    static async recreate(navigationInterface, {navigationId, ...info}){
        var navigation = await navigationInterface.getNavigation(navigationId);
        if(!navigation){
            console.log(`could not recreate notification for navigation '${navigationId}'`)
            return null;
        }
        var notification = new ButtonNotification(navigationInterface, navigation, info);
        return notification;
    }
}

class Button{
    constructor(navigationInterface, buttonInteraction, tabId, notifications){
        this.tabId = tabId;
        this.notifications = notifications || [];
        this.disappeared = new Event();
        this.cancellationToken = new CancellationToken();
        this.navigationInterface = navigationInterface;
        this.buttonInteraction = buttonInteraction;
        for(let notification of this.notifications){
            this.addNotificationEventListeners(notification);
        }
    }
    addNotificationEventListeners(notification){
        notification.updated.listen(() => {
            this.update();
        }, this.cancellationToken);
        notification.disappeared.next(this.cancellationToken).then(() => {
            this.removeNotification(notification);
        });
    }
    addNotification(navigation, info){
        var notification = this.notifications.find(n => n.navigation.id === navigation.id);
        if(!notification){
            notification = ButtonNotification.create(this.navigationInterface, navigation, info);
            if(!notification){
                return;
            }
            this.notifications.push(notification);
            this.addNotificationEventListeners(notification);
        }else{
            notification.update(info);
        }
        this.update();
    }
    async prune(){
        await Promise.all(this.notifications.map(n => this.removeNotificationIfNecessary(n)));
        this.update();
    }
    removeNotification(notification){
        var index = this.notifications.indexOf(notification);
        if(index > -1){
            this.notifications.splice(index, 1);
            this.update();
        }
    }
    async removeNotificationIfNecessary(notification){
        if(await notification.exists()){
            return;
        }
        var index = this.notifications.indexOf(notification);
        if(index > -1){
            this.notifications.splice(index, 1);
        }
    }
    disappear(){
        this.cancellationToken.cancel();
        this.disappeared.dispatch();
    }
    update(){
        if(this.notifications.length === 0){
            this.buttonInteraction.setBadgeText({tabId: this.tabId, text: ``});
            this.disappear();
            return;
        }
        var numberOfRules = this.notifications.map(n => n.numberOfRules).reduce((a, b) => a + b, 0);
        var numberOfRulesThatHaveSomethingToDo = this.notifications.map(n => n.numberOfRulesThatHaveSomethingToDo).reduce((a, b) => a + b, 0);
        var numberOfRulesThatHaveExecuted = this.notifications.map(n => n.numberOfRulesThatHaveExecuted).reduce((a, b) => a + b, 0);
        if(numberOfRulesThatHaveExecuted > 0){
            this.buttonInteraction.setBadgeText({tabId: this.tabId, text: `${numberOfRulesThatHaveExecuted}`});
            this.buttonInteraction.setBadgeBackgroundColor({tabId: this.tabId, color: '#28a745'});
        }else if(numberOfRulesThatHaveSomethingToDo > 0){
            this.buttonInteraction.setBadgeText({tabId: this.tabId, text: `${numberOfRulesThatHaveSomethingToDo}`});
            this.buttonInteraction.setBadgeBackgroundColor({tabId: this.tabId, color: '#007bff'});
        }else if(numberOfRules > 0){
            this.buttonInteraction.setBadgeText({tabId: this.tabId, text: `${numberOfRules}`});
            this.buttonInteraction.setBadgeBackgroundColor({tabId: this.tabId, color: '#6c757d'});
        }
    }
    serialize(){
        return {
            tabId: this.tabId,
            notifications: this.notifications.map(n => n.serialize())
        };
    }
    static create(navigationInterface, buttonInteraction, navigation, notificationInfo){
        var notification = ButtonNotification.create(navigationInterface, navigation, notificationInfo);
        if(notification === null){
            return null;
        }
        var button = new Button(navigationInterface, buttonInteraction, navigation.tabId);
        button.addNotification(navigation, notificationInfo);
        return button;
    }
    static async recreate(navigationInterface, buttonInteraction, {tabId, notifications}){
        var notifications = (await Promise.all(notifications.map(n => ButtonNotification.recreate(navigationInterface, n)))).filter(n => !!n);
        if(notifications.length === 0){
            return null;
        }
        var button = new Button(navigationInterface, buttonInteraction, tabId, notifications);
        button.update();
        return button;
    }
}

class ButtonCollection{
    constructor(navigationInterface, storage, buttonInteraction){
        this.loaded = false;
        this.buttons = [];
        this.navigationInterface = navigationInterface;
        this.storage = storage;
        this.buttonInteraction = buttonInteraction;
    }
    async prune(){
        await this.ensureLoaded();
        await Promise.all(this.buttons.map(b => b.prune()));
        this.save();
    }
    async ensureLoaded(){
        if(this.loaded){
            return;
        }
        var stringifiedButtons = this.storage.getItem('buttons') || [];
        this.buttons = (await Promise.all(stringifiedButtons.map(b => Button.recreate(this.navigationInterface, this.buttonInteraction, b)))).filter(n => !!n);
        for(let button of this.buttons){
            this.addButtonEventListeners(button);
        }
        this.save();
        this.loaded = true;
    }
    addButtonEventListeners(button){
        button.disappeared.next().then(() => {
            this.removeButton(button);
        });
    }
    async addNotification({navigationId, ...info}){
        await this.ensureLoaded();
        var navigation = await this.navigationInterface.getNavigation(navigationId);
        if(!navigation){
            console.warn(`could not find navigation '${navigationId}'`);
            return;
        }
        var button = this.buttons.find(b => b.tabId === navigation.tabId);
        if(!button){
            button = Button.create(this.navigationInterface, this.buttonInteraction, navigation, info);
            if(button === null){
                return;
            }
            this.buttons.push(button);
            this.addButtonEventListeners(button);
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
        this.storage.setItem('buttons', this.buttons.map(b => b.serialize()));
    }
}

export { ButtonCollection };