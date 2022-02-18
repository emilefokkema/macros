const path = require('path');

module.exports = {
	entry: './src/management/management.js',
	resolve: {
	  extensions: [ '.js' ]
	},
	output: {
	  filename: 'management.js',
	  path: path.resolve(__dirname, 'dist'),
	  library: 'management',
	  libraryTarget: 'umd',
	  globalObject: 'this'
	}
};