class Selector{
	constructor(text, nodeName, id, classes, attributeNames){
		this.text = text;
        this.nodeName = nodeName;
        this.id = id;
        this.classes = classes;
		this.attributeNames = attributeNames;
	}
    static forElement(element){
        var id, classes = [];
        var nodeName = element.localName || '';
        var attributeNames = [];
        try{
            attributeNames = element.getAttributeNames();
        }catch(e){
            console.log(`could not getAttributeNames() for element`, element)
        }
        var attributePartOfText = '';
        var classPartOfText = '';
        for(let attributeName of attributeNames){
            if(attributeName === 'id'){
                id = element.getAttribute('id');
            }else if(attributeName === 'class'){
                classes = (element.getAttribute('class') || '').match(/\S+/g) || [];
                classPartOfText = classes.map(c => `.${CSS.escape(c)}`).join('');
            }else{
                attributePartOfText += `[${CSS.escape(attributeName)}]`;
            }
        }
        var text  = `${nodeName}${(id ? `#${CSS.escape(id)}`: '')}${classPartOfText}${attributePartOfText}`;
        return new Selector(text, nodeName, id, classes, attributeNames);
    }
	static create(text){
		var attributeNames = [];
        var nodeName;
		var hasId = false;
        var id;
        var classes = [];
		var hasClass = false;
		var rgx = /(?:^([^\.\[#]+))|(?:#([^\.\[]+))|(?:\.([^#\.\[]+))|\[([^=]+)(?:=(?:"[^"]*"|[^\]]+))?\]/g;
		var match;
		while((match = rgx.exec(text)) !== null){
            if(match[1]){
                nodeName = match[1];
            }
			else if(match[2]){
				hasId = true;
                id = match[2];
			}else if(match[3]){
				hasClass = true;
                classes.push(match[3]);
			}else if(match[4]){
				attributeNames.push(match[4])
			}
		}
		if(hasId && !attributeNames.some(n => n === 'id')){
			attributeNames.push('id');
		}
		if(hasClass && !attributeNames.some(n => n === 'class')){
			attributeNames.push('class');
		}
		return new Selector(text, nodeName, id, classes, attributeNames);
	}
    static isValidSelector(text){
        try{
            document.querySelector(text);
            return true;
        }catch(e){
            return false;
        }
    }
}

export { Selector };