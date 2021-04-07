var storage = {
	getItem(name){
		return new Promise((resolve, reject) => {
			chrome.storage.local.get([name], (items) => {
				var lastError = chrome.runtime.lastError;
				if(lastError){
					reject(`error when getting '${name}' from storage: ${lastError.message}`);
				}else{
					resolve(items[name]);
				}
			});
		});
	},
	setItem(name, value){
		return new Promise((resolve, reject) => {
			chrome.storage.local.set({[name]: value}, () => {
				var lastError = chrome.runtime.lastError;
				if(lastError){
					reject(`error when setting value for '${name}' to storage: ${lastError.message}`);
				}else{
					resolve();
				}
			});
		});
	}
};

export { storage };