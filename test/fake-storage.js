export class FakeStorage{
    constructor(){
        this.items = {};
    }
    getItem(key){
        return this.items[key];
    }
    setItem(key, value){
        this.items[key] = value;
    }
}