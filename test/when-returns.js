function delayZero(fn){
    return (...args) => setTimeout(() => {
        fn(...args);
    },0)
}

export function whenReturns(object, methodName, expectedArguments){
    return new Promise((resolve, reject) => {
        resolve = delayZero(resolve);
        reject = delayZero(reject);
        const expectedArgumentsStringified = JSON.stringify(expectedArguments);
        const original = object[methodName];
        const spy = jest.spyOn(object, methodName).mockImplementation((...args) => {
            if(JSON.stringify(args) !== expectedArgumentsStringified){
                return original.apply(object, args);
            }
            try{
                const result = original.apply(object, args);
                if(result instanceof Promise){
                    result.then(v => {
                        resolve(result);
                    }).catch((e) => {
                        reject(e);
                    })
                }else{
                    resolve(result);
                }
                return result;
            }catch(e){
                reject(e);
            }finally{
                spy.mockReset();
            }
        });
    });
}