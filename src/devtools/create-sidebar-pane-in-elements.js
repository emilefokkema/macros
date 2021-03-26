import { PromiseResolver } from '../shared/promise-resolver';

export function createSidebarPaneInElements(title, url){
    var resolver = new PromiseResolver();
    chrome.devtools.panels.elements.createSidebarPane(title,
		function(sidebar) {
			sidebar.setPage(url);
            resolver.resolve();
		});
    return resolver.promise;
}