const fs = require("fs");
const yargs = require('yargs');
const argv = yargs(process.argv.slice(2)).option('d', {alias: 'development', type: 'boolean'}).argv;

if(!fs.existsSync('./dist')){
	fs.mkdirSync('./dist');
}

copyFile('./src/manifest.json', './dist/manifest.json');

copyFile('./src/create-rule/create-rule.css', './dist/create-rule.css');
copyFile('./src/create-rule/create-rule.js', './dist/create-rule.js');
copyFile('./src/create-rule/create-rule.html', './dist/create-rule.html');

copyFile('./src/management/management.css', './dist/management.css');
copyFile('./src/management/management.js', './dist/management.js');
copyFile('./src/management/management.html', './dist/management.html');

copyFile('./src/popup/popup.css', './dist/popup.css');
copyFile('./src/popup/popup.js', './dist/popup.js');
copyFile('./src/popup/popup.html', './dist/popup.html');

copyFile('./src/devtools-sidebar/devtools_sidebar.css', './dist/devtools_sidebar.css');
copyFile('./src/devtools-sidebar/devtools_sidebar.js', './dist/devtools_sidebar.js');
copyFile('./src/devtools-sidebar/devtools_sidebar.html', './dist/devtools_sidebar.html');

copyFile('./src/shared/shared.css', './dist/shared.css');
copyFile('./src/devtools.html', './dist/devtools.html');

copyFile('./src/icon_128.png', './dist/icon_128.png');
copyFile('./src/icon_48.png', './dist/icon_48.png');
copyFile('./src/icon_16.png', './dist/icon_16.png');

if(argv.development){
	copyFile('./node_modules/vue/dist/vue.js', './dist/vue.js');
}else{
	copyFile('./node_modules/vue/dist/vue.min.js', './dist/vue.js');
}

function copyFile(src, dest){
	fs.copyFile(src, dest, (err) => {
		if(err){
			console.warn(`error copying ${src} to ${dest}: `, err);
			return;
		}
		console.log(`copied ${src} to ${dest}`);
	});
}