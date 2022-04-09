const puppeteer = require('puppeteer');
const { ProxyTransport } = require('./proxy-transport');
const { wrapDevtoolsBrowser } = require('./browser-wrapper');
const { isDevtoolsPageUrl } = require('./is-devtools-page-url');
const { AcrossShadowRootsQueryHandler } = require('../../util/across-shadow-roots-query-handler');

async function connect(browser){
    const wsEndpoint = browser.wsEndpoint();
    const proxyTransport = await ProxyTransport.create(wsEndpoint, {
        eventInterceptors: [
            {
                shouldIntercept({method, params}){
                    if(
                        method !== 'Target.targetCreated' && 
                        method !== 'Target.targetInfoChanged' && 
                        method !== 'Target.attachedToTarget'){
                        return false;
                    }
                    const {targetInfo: {url}} = params;
                    return isDevtoolsPageUrl(url);
                },
                intercept(event, replaceWith){
                    //console.log(`Received '${event.method}'. fooling puppeteer into thinking target is of type 'page': `, event.params.targetInfo)
                    const newEvent = JSON.parse(JSON.stringify(event));
                    newEvent.params.targetInfo.type = 'page';
                    replaceWith(newEvent);
                }
            }
        ]
    })
    puppeteer.registerCustomQueryHandler('acrossShadowRoots', AcrossShadowRootsQueryHandler.create());
    const devtoolsBrowser = await puppeteer.connect({transport: proxyTransport, defaultViewport: null});
    return wrapDevtoolsBrowser(devtoolsBrowser);
}

module.exports = { connect }