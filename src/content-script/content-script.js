import { navigation } from '../shared/navigation/navigation-interface';
import { crossBoundaryEventFactory } from '../shared/cross-boundary-events';
import { contentScriptFunction } from './content-script-function';
import { documentMutationsProvider } from './document-mutations-provider';


const {elementSelectedInDevtools} = contentScriptFunction(navigation, crossBoundaryEventFactory, documentMutationsProvider);

export {elementSelectedInDevtools};
