export function validateArrayOfRules(value){
    if(!Array.isArray(value)){
        return 'The value is not an array';
    }
    for(let itemIndex = 0, numberOfItems = value.length; itemIndex < numberOfItems; itemIndex++){
        const item = value[itemIndex];
        if(typeof item !== 'object'){
            return `The value at position ${itemIndex} of the array is not an object`;
        }
        const {automatic, name, urlPattern, actions} = item;
        if(typeof automatic !== 'boolean'){
            return `${JSON.stringify(automatic)} is not a valid value for 'automatic' (at position ${itemIndex} in the array)`;
        }
        if(typeof name !== 'string'){
            return `${JSON.stringify(name)} is not a valid value for 'name' (at position ${itemIndex} in the array)`;
        }
        if(typeof urlPattern !== 'string'){
            return `${JSON.stringify(urlPattern)} is not a valid value for 'urlPattern' (at position ${itemIndex} in the array)`;
        }
        if(!Array.isArray(actions)){
            return `The provided value for 'actions' at position ${itemIndex} in the array is not an array`
        }
    }
    return null;
}