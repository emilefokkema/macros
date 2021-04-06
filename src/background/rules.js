import { Event } from '../shared/events';

function urlMatchesPattern(url, pattern){
	var regexPattern = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[\\S]*?');
	var regex = new RegExp(`^${regexPattern}$`);
	return !!url.match(regex);
}

class RuleCollection{
	constructor(storage){
		this.loaded = false;
		this.latestRuleId = 0;
		this.rules = [];
		this.ruleUpdated = new Event();
		this.ruleAdded = new Event();
		this.ruleDeleted = new Event();
		this.storage = storage;
	}
	async load(){
		this.rules = await this.storage.getItem('rules') || [];
		if(this.rules.length > 0){
			this.latestRuleId = Math.max.apply(Math, this.rules.map(r => r.id));
		}
		this.loaded = true;
	}
	async ensureLoaded(){
		if(this.loaded){
			return;
		}
		await this.load();
	}
	async save(){
		await this.storage.setItem('rules', this.rules);
	}
	async deleteRule(ruleId){
		await this.ensureLoaded();
		var index = this.rules.findIndex(r => r.id === ruleId);
		if(index > -1){
			this.rules.splice(index, 1);
			this.ruleDeleted.dispatch({ruleId});
			await this.save();
		}
	}
	async saveRule(rule){
		await this.ensureLoaded();
		if(rule.id === undefined){
			return await this.saveNewRule(rule);
		}
		await this.updateRule(rule);
		return rule.id;
	}
	async saveNewRule(rule){
		rule.id = ++this.latestRuleId;
		this.rules.push(rule);
		await this.save();
		this.ruleAdded.dispatch();
		return rule.id;
	}
	async updateRule(rule){
		if(rule.id === undefined){
			return;
		}
		var index = this.rules.findIndex(r => r.id == rule.id);
		if(index == -1){
			return;
		}
		this.rules.splice(index, 1);
		this.rules.push(rule);
		await this.save();
		this.ruleUpdated.dispatch({ruleId: rule.id});
	}
	async getAll(){
		await this.ensureLoaded();
		return this.rules.slice();
	}
	async getRule(ruleId){
		await this.ensureLoaded();
		return this.rules.find(r => r.id === ruleId);
	}
	async getRulesForUrl(url){
		await this.ensureLoaded();
		return this.rules.filter(r => urlMatchesPattern(url, r.urlPattern));
	}
}

export { RuleCollection };