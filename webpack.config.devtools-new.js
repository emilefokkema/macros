const path = require('path');

module.exports = {
	entry: './src/devtools-new.js',
	resolve: {
	  extensions: [ '.js' ]
	},
	output: {
	  filename: 'devtools.js',
	  path: path.resolve(__dirname, 'dist'),
	  library: 'devtools',
	  libraryTarget: 'umd',
	  globalObject: 'this'
	}
};