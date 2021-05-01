function delayZero(fn){
    return (...args) => setTimeout(() => {
        fn(...args);
    },0)
}

export function whenReturns(object, methodName, argumentsPredicate, callCount){
    return new Promise((resolve, reject) => {
        resolve = delayZero(resolve);
        reject = delayZero(reject);
        const original = object[methodName];
        let callCounter = 0;
        const spy = jest.spyOn(object, methodName).mockImplementation((...args) => {
            callCounter++;
            if(argumentsPredicate && !argumentsPredicate(args)){
                return original.apply(object, args);
            }
            if(callCount !== undefined && callCounter < callCount){
                return original.apply(object, args);
            }
            try{
                const result = original.apply(object, args);
                if(result instanceof Promise){
                    result.then(v => {
                        resolve({
                            returnValue: v,
                            args
                        });
                    }).catch((e) => {
                        reject(e);
                    })
                }else{
                    resolve({
                        returnValue: result,
                        args
                    });
                }
                return result;
            }catch(e){
                reject(e);
            }finally{
                spy.mockRestore();
            }
        });
    });
}