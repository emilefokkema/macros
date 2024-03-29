var editors = {
    createEditorUrl(navigationId, ruleId){
		var searchParams = new URLSearchParams();
		if(navigationId){
			searchParams.append('navigationId', navigationId);
		}
		if(ruleId){
			searchParams.append('ruleId', ruleId);
		}
		const page = `create-rule.html?${searchParams}`;
        var searchParams2 = new URLSearchParams();
        searchParams2.append('page', page);
        return `sandbox.html?${searchParams2}`;
    },
    getParamsFromHref(href){
        var url = new URL(href);
        var navigationId = url.searchParams.get('navigationId');
        var ruleId = url.searchParams.get('ruleId');
        return {
            navigationId: navigationId || undefined,
            ruleId: (ruleId || undefined) && parseInt(ruleId)
        };
    },
    replaceParamsInHref(href, navigationId, ruleId){
        var url = new URL(href);
        url.searchParams.delete('navigationId');
        if(navigationId){
			url.searchParams.append('navigationId', navigationId);
        }
        url.searchParams.delete('ruleId');
        if(ruleId){
			url.searchParams.append('ruleId', ruleId);
        }
        return url.toString();
    }
};

export { editors }