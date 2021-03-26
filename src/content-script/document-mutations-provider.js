import { DocumentMutations } from './document-mutations';

class DocumentMutationsProvider{
    getMutations(attributeNames){
        return new DocumentMutations(attributeNames);
    }
}

var documentMutationsProvider = new DocumentMutationsProvider();

export { documentMutationsProvider };