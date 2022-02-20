const ruleDefinitions = {
    DELETE_ACTION_TYPE: 'delete',
    REMOVE_CLASS_ACTION_TYPE: 'removeClass',
    REMOVE_STYLE_PROPERTY_ACTION_TYPE: 'removeStyleProperty',
    SELECT_ACTION_TYPE: 'select',
    getDeleteActionDefinition(){
        return {type: this.DELETE_ACTION_TYPE};
    },
    getRemoveClassActionDefinition(_class){
        return {type: this.REMOVE_CLASS_ACTION_TYPE, class: _class};
    },
    getRemoveStylePropertyActionDefinition(property){
        return {type: this.REMOVE_STYLE_PROPERTY_ACTION_TYPE, property: property};
    },
    getSelectActionDefinition(selectorText, actionDefitition){
        if(!actionDefitition){
            actionDefitition = this.getDeleteActionDefinition();
        }
        return {
            type: this.SELECT_ACTION_TYPE,
            selector: selectorText,
            action: actionDefitition
        };
    },
    getSelectActionActionDefinitionOfType(selectActionActionType){
        switch(selectActionActionType){
            case this.DELETE_ACTION_TYPE: return this.getDeleteActionDefinition();
            case this.REMOVE_CLASS_ACTION_TYPE: return this.getRemoveClassActionDefinition();
            case this.REMOVE_STYLE_PROPERTY_ACTION_TYPE: return this.getRemoveStylePropertyActionDefinition();
        }
    },
    nodeActionsAreEqual(action, otherAction){
        if(!action){
            return !otherAction;
        }
        if(!otherAction){
            return false;
        }
        if(action.type !== otherAction.type){
            return false;
        }
        switch(action.type){
            case this.DELETE_ACTION_TYPE: return true;
            case this.REMOVE_CLASS_ACTION_TYPE: return action.class === otherAction.class;
            case this.REMOVE_STYLE_PROPERTY_ACTION_TYPE: return action.property === otherAction.property;
        }
    },
    selectActionsAreEqual(action, otherAction){
        return action.selector === otherAction.selector && this.nodeActionsAreEqual(action.action, otherAction.action);
    },
    actionsAreEqual(action, otherAction){
        if(!action){
            return !otherAction;
        }
        if(!otherAction){
            return false;
        }
        if(action.type !== otherAction.type){
            return false;
        }
        switch(action.type){
            case this.SELECT_ACTION_TYPE: return this.selectActionsAreEqual(action, otherAction);
        }
        return false;
    },
    actionIsAchievedByOther(action, otherAction){
        if(action.type !== otherAction.type){
            return false;
        }
        switch(action.type){
            case this.DELETE_ACTION_TYPE: return true;
            case this.REMOVE_CLASS_ACTION_TYPE: return action.class === otherAction.class;
            case this.REMOVE_STYLE_PROPERTY_ACTION_TYPE: return action.property === otherAction.property;
        }
    },
    rulesAreEqual(one, other){
        if(!one){
            return !other;
        }
        if(!other){
            return false;
        }
        if(one.name !== other.name || 
            one.urlPattern !== other.urlPattern || 
            one.automatic !== other.automatic){
                return false;
        }
        if(one.actions){
            if(!other.actions){
                return false;
            }
            if(one.actions.length !== other.actions.length){
                return false;
            }
            for(let i = 0; i < one.actions.length; i++){
                if(!this.actionsAreEqual(one.actions[i], other.actions[i])){
                    return false;
                }
            }
            return true;
        }else{
            return !other.actions;
        }
    }
};

export { ruleDefinitions }