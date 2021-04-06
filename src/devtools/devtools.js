import { elementSelectionChanged } from './element-selection-changed';
import { inspectedWindow } from '../shared/inspected-window';
import { createSidebarPaneInElements } from './create-sidebar-pane-in-elements';
import { navigation } from '../shared/navigation/navigation-interface';
import { crossBoundaryEventFactory } from '../shared/cross-boundary-events';
import { devtoolsFunction } from './devtools-function';

devtoolsFunction(inspectedWindow, createSidebarPaneInElements, elementSelectionChanged, navigation, crossBoundaryEventFactory);