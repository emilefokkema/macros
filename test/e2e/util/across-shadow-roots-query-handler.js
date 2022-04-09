class AcrossShadowRootsQueryHandler{
    static create(){
        return {
            queryOne: (element, selector) => {
                let result = element.querySelector(selector);
                if(result){
                    return result;
                }
                for(let shadowRoot of findShadowRootsInNode(element)){
                    result = shadowRoot.querySelector(selector);
                    if(result){
                        return result;
                    }
                }
                return null;
                function *findShadowRootsInNode(node){
                    const iterator = document.createNodeIterator(node, NodeFilter.SHOW_ELEMENT);
                    let element;
                    while(element = iterator.nextNode()){
                        if(element.shadowRoot !== null){
                            yield element.shadowRoot;
                            for(let shadowRoot in findShadowRootsInNode(element.shadowRoot)){
                                yield shadowRoot;
                            }
                        }
                    }
                }
            },
            queryAll: (element, selector) => {
                const result = [];
                for(let resultElement of element.querySelectorAll(selector)){
                    result.push(resultElement);
                }
                for(let shadowRoot of findShadowRootsInNode(element)){
                    for(let resultElement of shadowRoot.querySelectorAll(selector)){
                        result.push(resultElement);
                    }
                }
                return result;
                function *findShadowRootsInNode(node){
                    const iterator = document.createNodeIterator(node, NodeFilter.SHOW_ELEMENT);
                    let element;
                    while(element = iterator.nextNode()){
                        if(element.shadowRoot !== null){
                            yield element.shadowRoot;
                            for(let shadowRoot in findShadowRootsInNode(element.shadowRoot)){
                                yield shadowRoot;
                            }
                        }
                    }
                }
            }
        };
    }
}

module.exports = { AcrossShadowRootsQueryHandler }