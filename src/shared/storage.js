var storage = {
	getItem(name){
		var stringified = localStorage.getItem(name);
		if(stringified === null){
			return null;
		}
		return JSON.parse(stringified);
	},
	setItem(name, value){
		localStorage.setItem(name, JSON.stringify(value));
	}
};

export { storage };