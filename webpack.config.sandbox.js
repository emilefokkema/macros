const path = require('path');

module.exports = {
	entry: './src/sandbox/sandbox.js',
	resolve: {
	  extensions: [ '.js' ]
	},
	output: {
	  filename: 'sandbox.js',
	  path: path.resolve(__dirname, 'dist'),
	  library: 'sandbox',
	  libraryTarget: 'umd',
	  globalObject: 'this'
	}
};