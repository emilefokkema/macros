export function debounce(fn, timeout){
	let latestArgs, timeoutId;
	return function(){
		const args = [].slice.apply(arguments);
		if(timeoutId === undefined){
			fn.apply(this, args);
			timeoutId = setTimeout(() => {
				if(latestArgs !== undefined){
					try{
						fn.apply(this, latestArgs);
					}finally{
						latestArgs = undefined;
					}
				}
				timeoutId = undefined;
			}, timeout);
		}else{
			latestArgs = args;
		}
	};
}