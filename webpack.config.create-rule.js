const path = require('path');

module.exports = {
	entry: './src/create-rule/create-rule.js',
	resolve: {
	  extensions: [ '.js' ]
	},
	output: {
	  filename: 'create-rule.js',
	  path: path.resolve(__dirname, 'dist'),
	  library: 'createRule',
	  libraryTarget: 'umd',
	  globalObject: 'this'
	}
};