import { navigation } from './navigation/navigation-interface';
import { crossBoundaryEventFactory } from './cross-boundary-events';
import { inspectedWindow } from './inspected-window';
import { Macros } from './macros-class';

var macros = new Macros(navigation, inspectedWindow, crossBoundaryEventFactory);

export {macros};