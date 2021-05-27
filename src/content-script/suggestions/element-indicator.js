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
        this.indicator.style.width = `${rect.width}px`;
        this.indicator.style.height = `${rect.height}px`;
        this.indicator.style.left = `${rect.left}px`;
        this.indicator.style.top = `${rect.top}px`;
        document.body.appendChild(this.indicator);
    }
    stopIndicatingElement(el){
        if(this.indicator.parentElement !== null){
            this.indicator.parentElement.removeChild(this.indicator);
        }
    }
}