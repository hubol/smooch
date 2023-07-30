const path = require('path');

const externals = (...items) => {
	const obj = {};
	for (const item of items) {
		obj[item] = `require("${item}");`;
	}
	
	return obj;
}

module.exports = {
	target: 'node',
	externals: externals('@parcel/watcher', 'sharp'), // removes node_modules from your final bundle
	entry: './lib/main/cli.ts', // make sure this matches the main root of your code 
	output: {
		path: path.join(__dirname, 'dist'), // this can be any path and directory you want
		filename: './bundle/index.js',
	},
	optimization: {
		minimize: false, // enabling this reduces file size and readability
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				exclude: [/node_modules/],
				loader: 'ts-loader'
			}
		]
	},
	resolve: { extensions: [ '.js', '.ts', '.json' ] },
};