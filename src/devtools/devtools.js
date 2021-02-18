import { macros } from '../shared/macros';
import { elementSelectionChanged } from './element-selection-changed';
import { inspectedWindow } from '../shared/inspected-window';
import { createSidebarPaneInElements } from './create-sidebar-pane-in-elements';

createSidebarPaneInElements('Macros', 'devtools_sidebar.html');

var tabId = inspectedWindow.tabId;

async function notifyContentScriptForNavigation(navigation){
    try{
        await inspectedWindow.eval('contentScript.elementSelectedInDevtools($0)', {
            useContentScriptContext: true,
            frameURL: navigation.url
        });
    }catch(e){
        console.log(`failed to notify content script for navigation '${navigation.id}': `, e)
    }
}

elementSelectionChanged.listen(async () => {
    var inspectedNagivations = await macros.navigation.getAllForTab(tabId);
    for(let inspectedNavigation of inspectedNagivations){
        notifyContentScriptForNavigation(inspectedNavigation);
    }
});


