export class ClassRepository{
    *getApplicableCssStyleRules(element, propertyNames){
        for(let styleSheet of document.styleSheets){
            try{
                for(let cssRule of styleSheet.cssRules){
                    if(cssRule instanceof CSSStyleRule && element.matches(cssRule.selectorText) && propertyNames.some(p => cssRule.style.getPropertyValue(p) !== '')){
                        yield cssRule;
                    }
                }
            }catch(e){}
        }
    }
    *getClassNamesFromSelectorText(selectorText){
		const regexp = /\.((?:-?[_a-zA-Z])[-_a-zA-Z0-9]*)/g;
		let match;
		while ((match = regexp.exec(selectorText)) !== null) {
			yield match[1];
		}
	}
    *getClassesThatLeadToPropertiesOnElement(element, propertyNames){
        for(let applicableRule of this.getApplicableCssStyleRules(element, propertyNames)){
            for(let classNameInSelector of this.getClassNamesFromSelectorText(applicableRule.selectorText)){
                yield classNameInSelector;
            }
        }
    }
}