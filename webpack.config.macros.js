const path = require('path');

module.exports = {
	entry: './src/shared/macros-main.js',
	resolve: {
	  extensions: [ '.js' ]
	},
	output: {
	  filename: 'macros.js',
	  path: path.resolve(__dirname, 'dist'),
	  library: 'macros',
	  libraryTarget: 'umd',
	  globalObject: 'this'
	}
};