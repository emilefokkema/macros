import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'

export function addRuleToUrl(rule, urlString){
    const {id, ...rest} = rule;
    const encodedRule = compressToEncodedURIComponent(JSON.stringify(rest));
    const url = new URL(urlString);
    const existingHash = url.hash.replace(/^#/,'').replace(/toolrule.*$/,'');
    url.hash = `${existingHash}toolrule${encodedRule}`;
    return url.toString();
}

export function getRuleFromUrl(urlString){
    const match = new URL(urlString).hash.match(/toolrule(.*)$/);
    if(!match){
        return null;
    }
    const compressedRule = match[1];
    try{
        const decompressedRule = decompressFromEncodedURIComponent(compressedRule);
        return JSON.parse(decompressedRule);
    }catch(e){
        return null;
    }
}