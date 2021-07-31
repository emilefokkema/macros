export class Logger{
    constructor(parentLogger, numberOfIndents, scopeId, newScopeId, newContextId){
        this.scopeId = scopeId;
        this.parentLogger = parentLogger;
        this.numberOfIndents = numberOfIndents;
        this.padding = Array.apply(null, new Array(numberOfIndents)).map(x => `  `).join('');
        this.newScopeId = newScopeId;
        this.newContextId = newContextId;
        this.contexts = [];
    }
    log(message, nodeContext){
        message = `${this.padding}[${this.scopeId}] ${message}`;
        const contextId = nodeContext ? this.getNodeContextId(nodeContext) : undefined;
        console.log(`${message}${(contextId === undefined ? '':` (node ${contextId})`)}`)
    }
    getNodeContextId(nodeContext){
        if(this.parentLogger){
            return this.parentLogger.getNodeContextId(nodeContext);
        }
        const contextRecord = this.contexts.find(r => r.context === nodeContext);
        if(contextRecord){
            return contextRecord.id;
        }
        const id = this.newContextId++;
        this.contexts.push({
            id,
            context: nodeContext
        });
        return id;
    }
    finalize(){
        const nodeContexts = {};
        for(const record of this.contexts){
            nodeContexts[record.id] = record.context;
        }
        console.log(nodeContexts);
    }
    getNewScopeId(){
        if(this.parentLogger){
            return this.parentLogger.getNewScopeId();
        }
        return this.newScopeId++;
    }
    forNewScope(){
        return new Logger(this, this.numberOfIndents + 1, this.getNewScopeId(), undefined, undefined);
    }
    static create(){
        return new Logger(undefined, 0, 0, 1, 0);
    }
}