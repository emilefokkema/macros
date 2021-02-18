import { Event } from '../shared/events';
import { storage } from '../shared/storage';

function urlMatchesPattern(url, pattern){
	var regexPattern = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[\\S]*?');
	var regex = new RegExp(`^${regexPattern}$`);
	return !!url.match(regex);
}

class RuleCollection{
	constructor(){
		this.loaded = false;
		this.latestRuleId = 0;
		this.rules = [];
		this.ruleUpdated = new Event();
		this.ruleAdded = new Event();
		this.ruleDeleted = new Event();
	}
	load(){
		this.rules = storage.getItem('rules') || [];
		this.latestRuleId = Math.max.apply(Math, this.rules.map(r => r.id));
		console.log(`loaded ${this.rules.length} rules. Highest id: ${this.latestRuleId}`)
		this.loaded = true;
	}
	ensureLoaded(){
		if(this.loaded){
			return;
		}
		this.load();
	}
	save(){
		storage.setItem('rules', this.rules);
	}
	deleteRule(ruleId){
		this.ensureLoaded();
		var index = this.rules.findIndex(r => r.id === ruleId);
		if(index > -1){
			this.rules.splice(index, 1);
			this.save();
			this.ruleDeleted.dispatch({ruleId});
		}
	}
	saveRule(rule){
		this.ensureLoaded();
		if(rule.id === undefined){
			return this.saveNewRule(rule);
		}
		this.updateRule(rule);
		return rule.id;
	}
	saveNewRule(rule){
		rule.id = ++this.latestRuleId;
		this.rules.push(rule);
		this.save();
		this.ruleAdded.dispatch();
		return rule.id;
	}
	updateRule(rule){
		if(rule.id === undefined){
			return;
		}
		var index = this.rules.findIndex(r => r.id == rule.id);
		if(index == -1){
			return;
		}
		this.rules.splice(index, 1);
		this.rules.push(rule);
		this.save();
		this.ruleUpdated.dispatch({ruleId: rule.id});
	}
	getAll(){
		this.ensureLoaded();
		return this.rules.slice();
	}
	getRule(ruleId){
		this.ensureLoaded();
		return this.rules.find(r => r.id === ruleId);
	}
	getRulesForUrl(url){
		this.ensureLoaded();
		return this.rules.filter(r => urlMatchesPattern(url, r.urlPattern));
	}
}
var rules = new RuleCollection();

export { rules };