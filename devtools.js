(function(){
	chrome.devtools.panels.elements.createSidebarPane("Macros",
		function(sidebar) {
			sidebar.setPage("devtools_sidebar.html");
		});
	
	chrome.devtools.panels.elements.onSelectionChanged.addListener(() => {
		chrome.devtools.inspectedWindow.eval("elementSelectedInDevtools($0)",
		    { useContentScriptContext: true }, (result, exceptionInfo) => {
		    	if(exceptionInfo){
		    		console.log(`there was an exception calling eval:`, exceptionInfo)
		    	}else{
		    		console.log(`calling eval resulted in`, result)
		    	}
		    });
	})
})()