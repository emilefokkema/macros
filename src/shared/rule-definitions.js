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
    actionsAreEqual(action, otherAction){
        if(action.type !== otherAction.type){
            return false;
        }
        switch(action.type){
            case this.DELETE_ACTION_TYPE: return true;
            case this.REMOVE_CLASS_ACTION_TYPE: return action.class === otherAction.class;
            case this.REMOVE_STYLE_PROPERTY_ACTION_TYPE: return action.property === otherAction.property;
        }
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
    }
};

export { ruleDefinitions }