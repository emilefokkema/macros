import { macros } from '../shared/macros';
import { elementSelectionChanged } from './element-selection-changed';
import { inspectedWindow } from '../shared/inspected-window';
import { createSidebarPaneInElements } from './create-sidebar-pane-in-elements';

createSidebarPaneInElements('Macros', 'devtools_sidebar.html');

var tabId = inspectedWindow.tabId;

async function notifyContentScriptForNavigation(navigation){
    try{
        const options = {useContentScriptContext: true};
        if(navigation.frameId > 0){
            options.frameURL = navigation.url;
        }
        await inspectedWindow.eval('contentScript.elementSelectedInDevtools($0)', options);
    }catch(e){
        console.log(`failed to notify content script for navigation '${navigation.id}': `, e)
    }
}

macros.onElementSelectionChangedForNavigation(async (navigationId) => {
    const navigation = await macros.navigation.getNavigation(navigationId);
    notifyContentScriptForNavigation(navigation);
})

elementSelectionChanged.listen(async () => {
    macros.notifyElementSelectionChangedOnTab(tabId);
});
