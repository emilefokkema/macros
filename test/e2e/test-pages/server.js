const path = require('path')
const { createServer } = require('http-server')

class TestPagesServer{
    constructor(server){
        this.server = server;
    }
    close(){
        this.server.close();
    }
    static async create(){
        const root = path.resolve(__dirname, './content');
        const server = createServer({
            root
        });
        await new Promise((res) => {
            server.listen({
                port: 80
            }, res)
        });
        return new TestPagesServer(server);
    }
}

module.exports = { TestPagesServer }