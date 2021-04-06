import { setPopup } from './set-popup';
import { storage } from '../shared/storage';
import { buttonInteraction } from './button-interaction';
import { navigation } from '../shared/navigation/navigation-interface';
import { crossBoundaryEventFactory } from '../shared/cross-boundary-events';
import { backgroundScript } from './background-script-function';

backgroundScript(setPopup, storage, buttonInteraction, navigation, crossBoundaryEventFactory);