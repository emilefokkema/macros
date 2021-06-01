export class ElementIndicator{
    constructor(){
        const element = document.createElement('div');
        element.setAttribute('class', 'macros-element-indicator');
        this.indicator = element;
    }
    startIndicatingElement(el){
        const elementStyle = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        const zIndexValueString = elementStyle.getPropertyValue('z-index');
        const zIndexValue = isNaN(zIndexValueString) ? 0 : parseInt(zIndexValueString);
        this.indicator.style.zIndex = `${zIndexValue + 1}`;
        this.indicator.style.width = `${Math.max(rect.width, 1)}px`;
        this.indicator.style.height = `${Math.max(rect.height, 1)}px`;
        this.indicator.style.left = `${rect.left}px`;
        this.indicator.style.top = `${rect.top}px`;
        document.body.appendChild(this.indicator);
    }
    stopIndicatingElement(){
        if(this.indicator.parentElement !== null){
            this.indicator.parentElement.removeChild(this.indicator);
        }
    }
}