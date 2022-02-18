const path = require('path');

module.exports = {
	entry: './src/devtools-sidebar/devtools_sidebar.js',
	resolve: {
	  extensions: [ '.js' ]
	},
	output: {
	  filename: 'devtools_sidebar.js',
	  path: path.resolve(__dirname, 'dist'),
	  library: 'devtools-sidebar',
	  libraryTarget: 'umd',
	  globalObject: 'this'
	}
};