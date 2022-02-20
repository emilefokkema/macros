import { Event } from '../shared/events';
import { validateArrayOfRules } from './rule-validation';
import { ruleDefinitions } from '../shared/rule-definitions';

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
		this.draftRules = [];
		this.ruleUpdated = new Event();
		this.ruleAdded = new Event();
		this.ruleDeleted = new Event();
		this.draftRulesRemoved = new Event();
		this.storage = storage;
	}
	async getDraftRuleForNavigation(navigationId){
		await this.ensureLoaded();
		const record = this.draftRules.find(r => r.navigationId === navigationId);
		if(!record){
			return null;
		}
		return record.rule;
	}
	async pruneDraftRules(allowedNavigationIds){
		await this.ensureLoaded();
		const newDraftRules = [];
		const removedDraftRulesForNavigationIds = [];
		for(let draftRuleRecord of this.draftRules){
			if(allowedNavigationIds.some(id => id === draftRuleRecord.navigationId)){
				newDraftRules.push(draftRuleRecord);
			}else{
				removedDraftRulesForNavigationIds.push(draftRuleRecord.navigationId);
			}
		}
		this.draftRules = newDraftRules;
		await this.save();
		if(removedDraftRulesForNavigationIds.length > 0){
			this.draftRulesRemoved.dispatch(removedDraftRulesForNavigationIds);
		}
	}
	async updateDraftRuleForNavigation(navigationId, draftRule){
		await this.ensureLoaded();
		const record = this.draftRules.find(r => r.navigationId === navigationId);
		if(!record){
			return;
		}
		record.rule = draftRule;
		await this.save();
	}
	async createDraftRuleForNavigation(navigation){
		await this.ensureLoaded();
		const navigationUrl = new URL(navigation.url);
		const originallyProposedName = navigationUrl.hostname;
		let proposedName = originallyProposedName;
		let suffixIndex = 0;
		const existingDraftRuleRecord = this.draftRules.find(r => r.navigationId === navigation.id);
		const existingNames = this.rules.map(r => r.name).concat(this.draftRules.filter(d => d !== existingDraftRuleRecord).map(d => d.rule.name));
		while(existingNames.includes(proposedName)){
			proposedName = `${originallyProposedName} (${++suffixIndex})`;
		}
		const urlPattern = `${navigationUrl.origin}/*`;
		const draftRule = {
			name: proposedName,
			urlPattern,
			actions: []
		};
		if(existingDraftRuleRecord){
			existingDraftRuleRecord.rule = draftRule;
		}else{
			this.draftRules.push({
				navigationId: navigation.id,
				rule: draftRule
			});
		}
		await this.save();
		return draftRule;
	}
	async load(){
		this.rules = await this.storage.getItem('rules') || [];
		this.draftRules = await this.storage.getItem('draftRules') || [];
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
		await this.storage.setItem('draftRules', this.draftRules);
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
	async saveNewRuleIfNoEqualExists(rule){
		await this.ensureLoaded();
		for(let existingRule of this.rules){
			if(ruleDefinitions.rulesAreEqual(existingRule, rule, doLog)){
				return;
			}
		}
		return this.saveNewRule(rule);
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
	async getRulesForDownload(ruleIds){
		await this.ensureLoaded();
		const result = [];
		const rules = this.rules.filter(r => ruleIds.includes(r.id));
		for(let rule of rules){
			const {id, ...rest} = rule;
			result.push(rest);
		}
		return result;
	}
	async uploadRulesJson(jsonString){
		let content;
		try{
			content = JSON.parse(jsonString);
		}catch(e){
			return {error: e.toString()};
		}
		const validationError = validateArrayOfRules(content);
		if(validationError){
			return {error: validationError};
		}
		await this.ensureLoaded();
		const newRuleIds = [];
		for(let ruleToAdd of content){
			const ruleId = ++this.latestRuleId;
			ruleToAdd.id = ruleId;
			this.rules.push(ruleToAdd);
			newRuleIds.push(ruleId);
		}
		await this.save();
		this.ruleAdded.dispatch();
		return {ruleIds: newRuleIds}
	}
	async getRulesForUrl(url){
		await this.ensureLoaded();
		return this.rules.filter(r => urlMatchesPattern(url, r.urlPattern));
	}
}

export { RuleCollection };