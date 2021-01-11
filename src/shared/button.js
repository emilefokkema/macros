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
    static async create({navigationId, numberOfRules}){
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
    static async create({tabId, notifications}){
        var notifications = (await Promise.all(notifications.map(n => ButtonNotification.create(n)))).filter(n => !!n);
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
        this.buttons = (await Promise.all(stringifiedButtons.map(b => Button.create(b)))).filter(n => !!n);
        this.save();
        console.log(`button collection loaded ${this.buttons.length} buttons:`, JSON.parse(JSON.stringify(this.buttons)))
        this.loaded = true;
    }
    async addNotification({navigationId, numberOfRules}){
        await this.ensureLoaded();
        var navigation = await macros.navigation.getNavigation(navigationId);
        if(!navigation){
            console.warn(`could not find navigation '${navigationId}'`);
            return;
        }
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