const { TestPagesServer } = require('./server');
const { exec } = require('child_process')
const path = require('path');

async function run(){
    await TestPagesServer.create();
    const extensionPath = path.resolve(__dirname, '../../../dist');
    exec(`"C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe" --user-data-dir=c:\\temp-user-data-dir --disable-extensions-except=${extensionPath} --load-extension=${extensionPath}`)
}

run();