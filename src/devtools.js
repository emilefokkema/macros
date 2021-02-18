import { macros } from './shared/macros';
import { elementSelectionChanged } from './shared/devtools/element-selection-changed';
import { inspectedWindow } from './shared/devtools/inspected-window';
import { createSidebarPaneInElements } from './shared/devtools/create-sidebar-pane-in-elements';

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


