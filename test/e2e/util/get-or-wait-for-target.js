async function getOrWaitForTarget(browser, predicate){
    for(let target of browser.targets()){
        if(predicate(target)){
            return target;
        }
    }
    return await browser.waitForTarget(predicate);
}

module.exports = { getOrWaitForTarget };