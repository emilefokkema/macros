import { Macros } from '../shared/macros-class';

export function devtoolsFunction(inspectedWindow, createSidebarPaneInElements, elementSelectionChanged, navigationInterface, messageBus){
    var macros = new Macros(undefined, undefined, messageBus);
    let inspectedTabId;

    async function evalForNavigation(navigation, expression){
        const options = {useContentScriptContext: true};
        if(navigation.frameId > 0){
            options.frameURL = navigation.url;
        }
        return await inspectedWindow.eval(expression, options);
    }

    async function notifyElementSelectedInDevtoolsForNavigation(navigation){
        try{
            await evalForNavigation(navigation, 'contentScript.onElementSelectedInDevtools($0)')
        }catch(e){

        }
    }

    async function findSelectedElementInDevtoolsForNavigation(navigation){
        try{
            return await evalForNavigation(navigation, 'contentScript.getElementSelectedInDevtools($0)');
        }catch(e){
            return null;
        }
    }

    async function notifyElementSelectedInDevtools(){
        const navigations = await navigationInterface.getNavigationsForTabId(inspectedTabId);
        for(let navigation of navigations){
            notifyElementSelectedInDevtoolsForNavigation(navigation);
        }
    }

    async function findSelectedElementInDevtools(){
        const navigations = await navigationInterface.getNavigationsForTabId(inspectedTabId);
        let elementsFound = await Promise.all(navigations.map(n => findSelectedElementInDevtoolsForNavigation(n)));
        elementsFound = elementsFound.filter(e => !!e);
        if(elementsFound.length > 1){
            console.warn('unexpected: found selected element in devtools for more than one navigation')
        }
        return elementsFound[0];
    }

    async function initialize(){
        inspectedTabId = await inspectedWindow.getTabId();
        if(inspectedTabId === null){
            return;
        }
        const searchParams = new URLSearchParams();
        searchParams.set('tabId', inspectedTabId);
        const page = `devtools_sidebar.html?${searchParams}`;
        const searchParams2 = new URLSearchParams();
        searchParams2.set('page', page);
        createSidebarPaneInElements('RuleTool', `sandbox.html?${searchParams2}`);

        macros.onGetSelectedElementInDevtoolsRequest(({tabId}, sendResponse) => {
            if(tabId !== inspectedTabId){
                return;
            }
            findSelectedElementInDevtools().then(sendResponse);
            return true;
        });
    
        elementSelectionChanged.listen(async () => {
            notifyElementSelectedInDevtools();
        });
    }

    initialize();
}