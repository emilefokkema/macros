import { Event } from './shared/events';
import { macros } from './shared/macros';

function urlMatchesPattern(url, pattern){
	var regexPattern = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[\\S]*?');
	var regex = new RegExp(`^${regexPattern}$`);
	return !!url.match(regex);
}

class RuleCollection{
	constructor(){
		this.latestRuleId = 0;
		this.records = [];
		this.ruleUpdated = new Event();
		this.ruleAdded = new Event();
		this.ruleDeleted = new Event();
		this.load();
	}
	load(){
		var item = localStorage.getItem('rules');
		var parsed = JSON.parse(item);
		if(!Array.isArray(parsed)){
			return;
		}
		for(var rule of parsed){
			this.saveNewRule(rule);
		}
		console.log(`loaded ${this.records.length} rules`)
	}
	save(){
		var rules = this.records.map(r => r.rule);
		localStorage.setItem('rules', JSON.stringify(rules));
	}
	deleteRule(ruleId){
		var index = this.records.findIndex(r => r.ruleId === ruleId);
		if(index > -1){
			this.records.splice(index, 1);
			this.save();
			this.ruleDeleted.dispatch();
		}
	}
	saveNewRule(rule){
		var ruleId = ++this.latestRuleId;
		this.records.push({ruleId: ruleId, rule: rule});
		this.save();
		this.ruleAdded.dispatch();
		return ruleId;
	}
	updateRule(ruleId, rule){
		var record = this.getRecord(ruleId);
		if(!record){
			return;
		}
		record.rule = rule;
		this.save();
		this.ruleUpdated.dispatch();
	}
	getAll(){
		return this.records.slice();
	}
	getRecord(ruleId){
		return this.records.find(r => r.ruleId === ruleId);
	}
	getRulesForUrl(url){
		return this.records.filter(r => urlMatchesPattern(url, r.rule.urlPattern));
	}
	getRule(ruleId){
		var record = this.getRecord(ruleId);
		if(record){
			return record.rule;
		}
	}
}
var rules = new RuleCollection();

macros.setRuleCollection(rules);

export { rules };