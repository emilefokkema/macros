const { TestPagesServer } = require('./test-pages/server');

module.exports = async () => {
    global.__TEST_PAGE_SERVER__ = await TestPagesServer.create();
};