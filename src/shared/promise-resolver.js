class PromiseResolver{
	constructor(){
		this.promise = new Promise((res, rej) => {
			this.resolve = res;
			this.reject = rej;
		});
	}
}

export { PromiseResolver }