const path = require('path');

module.exports = {
	entry: './src/background/background.js',
	resolve: {
	  extensions: [ '.js' ]
	},
	output: {
	  filename: 'background.js',
	  path: path.resolve(__dirname, 'dist'),
	  library: 'background',
	  libraryTarget: 'umd',
	  globalObject: 'this'
	}
};