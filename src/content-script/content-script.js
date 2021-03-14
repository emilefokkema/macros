import { navigation } from '../shared/navigation/navigation-interface';
import { crossBoundaryEventFactory } from '../shared/cross-boundary-events';
import { inspectedWindow } from '../shared/inspected-window';
import { contentScriptFunction } from './content-script-function';


const {elementSelectedInDevtools} = contentScriptFunction(navigation, inspectedWindow, crossBoundaryEventFactory);

export {elementSelectedInDevtools};
