const url = new URL(location.href);
const manual = !!url.searchParams.get('manual')

addEventListener('load', () => {
    const iframe = document.getElementById('iframe');
    const iframeUrl = new URL(`${url.origin}/annoying-popup/`);
    if(manual){
        iframeUrl.searchParams.set('manual', 'true');
    }
    iframe.src = iframeUrl.toString();
});