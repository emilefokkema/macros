class ErrorMessage{
    constructor(parentElement, selector){
        this.parentElement = parentElement;
        this.selector = selector;
    }
    whenPresent(){
        return this.parentElement.waitForSelector(this.selector, {visible: true});
    }
    whenAbsent(){
        return this.parentElement.waitForSelector(this.selector, {hidden: true});
    }
}

module.exports = { ErrorMessage }