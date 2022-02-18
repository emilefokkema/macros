const path = require('path');

module.exports = {
	entry: './src/popup/popup.js',
	resolve: {
	  extensions: [ '.js' ]
	},
	output: {
	  filename: 'popup.js',
	  path: path.resolve(__dirname, 'dist'),
	  library: 'popup',
	  libraryTarget: 'umd',
	  globalObject: 'this'
	}
};