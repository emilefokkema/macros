import { Event } from '../shared/events';
import { ruleDefinitions } from '../shared/rule-definitions';
import { debounce } from '../shared/debounce';
import { Selector } from '../shared/selector';

class DeleteActionForm{
    constructor(){
        this.type = ruleDefinitions.DELETE_ACTION_TYPE;
        this.valueChanged = new Event();
    }
    getAction(){
        return {
            type: ruleDefinitions.DELETE_ACTION_TYPE
        };
    }
    setAction(){

    }
}

class RemoveStylePropertyActionForm{
    constructor(){
        this.type = ruleDefinitions.REMOVE_STYLE_PROPERTY_ACTION_TYPE;
        this._propertyName = undefined;
        this.valueChanged = new Event();
    }
    get propertyName(){
        return this._propertyName;
    }
    set propertyName(value){
        this._propertyName = value;
        this.valueChanged.dispatch();
    }
    getAction(){
        return {
            type: ruleDefinitions.REMOVE_STYLE_PROPERTY_ACTION_TYPE,
            property: this._propertyName
        };
    }
    setAction(action){
        this._propertyName = action.property;
    }
}

class RemoveClassActionForm{
    constructor(){
        this.type = ruleDefinitions.REMOVE_CLASS_ACTION_TYPE;
        this._className = undefined;
        this.valueChanged = new Event();
    }
    get className(){
        return this._className;
    }
    set className(value){
        this._className = value;
        this.valueChanged.dispatch();
    }
    getAction(){
        return {
            type: ruleDefinitions.REMOVE_CLASS_ACTION_TYPE,
            class: this._className
        };
    }
    setAction(action){
        console.log('RemoveClassActionForm setting action', action)
        this._className = action.class;
    }
}

function getSelectActionActionFormOfType(type){
    switch(type){
        case ruleDefinitions.DELETE_ACTION_TYPE: return new DeleteActionForm();
        case ruleDefinitions.REMOVE_STYLE_PROPERTY_ACTION_TYPE: return new RemoveStylePropertyActionForm();
        case ruleDefinitions.REMOVE_CLASS_ACTION_TYPE: return new RemoveClassActionForm();
    }
}

class SelectActionForm{
    constructor(id){
        this.type = ruleDefinitions.SELECT_ACTION_TYPE;
        this.id = id;
        this._selector = undefined;
        this.actionForm = undefined;
        this.valueChanged = new Event();
        this.valid = false;
        this.errors = undefined;
        this.debouncedValidate = debounce(this.validate, 200);
    }
    get selector(){
        return this._selector;
    }
    set selector(value){
        this._selector = value;
        this.debouncedValidate();
        this.valueChanged.dispatch();
    }
    validate(){
        const errors = {};
        let valid = true;
        if(!this._selector){
            errors['selectorRequired'] = true;
            valid = false;
        }else if(!Selector.isValidSelector(this._selector)){
            errors['selectorInvalid'] = true;
            valid = false;
        }
        if(!this.actionForm){
            errors['actionRequired'] = true;
            valid = false;
        }
        this.valid = valid;
        this.errors = valid ? undefined : errors;
    }
    internalSetActionOfType(type){
        const actionForm = getSelectActionActionFormOfType(type);
        actionForm.valueChanged.listen(() => {
            this.validate();
            this.valueChanged.dispatch();
        });
        this.actionForm = actionForm;
        return actionForm;
    }
    setActionOfType(type){
        this.internalSetActionOfType(type);
        this.validate();
        this.valueChanged.dispatch();
    }
    setAction(action){
        this._selector = action.selector;
        const actionForm = this.internalSetActionOfType(action.action.type);
        actionForm.setAction(action.action);
        this.validate();
    }
    getAction(){
        return {
            type: ruleDefinitions.SELECT_ACTION_TYPE,
            selector: this._selector,
            action: this.actionForm.getAction()
        };
    }
}

function getActionFormOfType(type, id){
    switch(type){
        case ruleDefinitions.SELECT_ACTION_TYPE: return new SelectActionForm(id)
    }
}

export class RuleForm{
    constructor(){
        this._id = undefined;
        this._name = undefined;
        this._urlPattern = undefined;
        this._automatic = false;
        this.actions = [];
        this._actionFormId = 0;
        this.valueChanged = new Event();
        this.valid = false;
        this.errors = undefined;
    }
    get id(){
        return this._id;
    }
    set id(value){
        this._id = value;
    }
    get name(){
        return this._name;
    }
    set name(value){
        this._name = value;
        this.validate();
        this.valueChanged.dispatch();
    }
    get urlPattern(){
        return this._urlPattern;
    }
    set urlPattern(value){
        this._urlPattern = value;
        this.validate();
        this.valueChanged.dispatch();
    }
    get automatic(){
        return this._automatic;
    }
    set automatic(value){
        this._automatic = !!value;
        this.valueChanged.dispatch();
    }
    validate(){
        const errors = {};
        let valid = true;
        if(!this._name){
            errors['nameRequired'] = true;
            valid = false;
        }
        if(!this._urlPattern){
            errors['urlPatternRequired'] = true;
            valid = false;
        }
        valid = valid && !this.actions.some(a => !a.valid);
        this.valid = valid;
        this.errors = valid ? undefined : errors;
    }
    internalAddActionOfType(type){
        const form = getActionFormOfType(type, this._actionFormId++);
        form.valueChanged.listen(() => {
            this.validate();
            this.valueChanged.dispatch();
        });
        form.validate();
        this.actions.push(form);
        return form;
    }
    getActionById(id){
        const form = this.actions.find(a => a.id === id);
        if(!form){
            return;
        }
        return form.getAction();
    }
    deleteActionById(id){
        const index = this.actions.findIndex(a => a.id === id);
        if(index === -1){
            return;
        }
        this.actions.splice(index, 1);
        this.validate();
        this.valueChanged.dispatch();
    }
    addActionOfType(type){
        this.internalAddActionOfType(type);
        this.validate();
        this.valueChanged.dispatch();
    }
    addSelectAction(selectorText){
        const form = this.internalAddActionOfType(ruleDefinitions.SELECT_ACTION_TYPE);
        form.selector = selectorText;
        this.validate();
        this.valueChanged.dispatch();
    }
    addAction(action){
        if(!action){
            return;
        }
        this.internalAddAction(action);
        this.validate();
        this.valueChanged.dispatch();
    }
    internalAddAction(action){
        const form = this.internalAddActionOfType(action.type);
        form.setAction(action);
    }
    setRule(rule){
        this._id = rule.id;
        this._name = rule.name;
        this._urlPattern = rule.urlPattern;
        this._automatic = !!rule.automatic;
        this.actions = [];
        for(let action of rule.actions){
            if(!action){
                continue;
            }
            this.internalAddAction(action);
        }
        this.validate();
    }
    getRule(){
        return {
            id: this._id,
            name: this._name,
            urlPattern: this._urlPattern,
            automatic: this.automatic,
            actions: this.actions.map(f => f.getAction())
        };
    }
}