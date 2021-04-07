var storage = {
	async getItem(name){
		var stringified = localStorage.getItem(name);
		if(stringified === null){
			return null;
		}
		return JSON.parse(stringified);
	},
	async setItem(name, value){
		localStorage.setItem(name, JSON.stringify(value));
	}
};

export { storage };