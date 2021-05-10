export async function whenBodyExists(){
    if(document && document.body){
        return;
    }
    await new Promise((resolve) => {
        const listener = () => {
            if(document && document.body){
                removeEventListener('load', listener);
                resolve();
            }
        };
        addEventListener('load', listener);
    });
}