import { macros } from './shared/macros';
import { elementSelectionChanged } from './shared/devtools/element-selection-changed';

elementSelectionChanged.listen(() => {console.log(`element selection changed!`)});


