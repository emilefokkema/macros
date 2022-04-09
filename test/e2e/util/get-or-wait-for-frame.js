async function getOrWaitForFrame(page, predicate){
    for(let frame of page.frames()){
        if(predicate(frame)){
            return frame;
        }
    }
    return await page.waitForFrame(predicate);
}

module.exports = { getOrWaitForFrame }