const path = require('path');

module.exports = {
	entry: './src/content-script/content-script-main.js',
	resolve: {
	  extensions: [ '.js' ]
	},
	output: {
	  filename: 'content-script.js',
	  path: path.resolve(__dirname, 'dist'),
	  library: 'contentScript',
	  libraryTarget: 'umd',
	  globalObject: 'this'
	}
};