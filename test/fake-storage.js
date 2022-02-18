export class FakeStorage{
    constructor(){
        this.items = {};
    }
    async getItem(key){
        return this.items[key];
    }
    async setItem(key, value){
        this.items[key] = value;
    }
}