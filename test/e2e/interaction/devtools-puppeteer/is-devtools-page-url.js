function isDevtoolsPageUrl(urlString){
    if(!urlString){
        return false;
    }
    let url;
    try{
        url = new URL(urlString);
    }catch(e){
        return false;
    }
    return url.protocol === 'devtools:' && url.hostname === 'devtools';
}

module.exports = { isDevtoolsPageUrl }