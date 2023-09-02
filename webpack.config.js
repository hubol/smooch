const path = require('path');
const ShebangPlugin = require('webpack-shebang-plugin');
const webpack = require('webpack');

const externals = (...items) => {
	const obj = {};
	for (const item of items) {
		obj[item] = `require("${item}");`;
	}
	
	return obj;
}

module.exports = {
	target: 'node',
	externals: externals('@parcel/watcher', '@ffmpeg-installer/ffmpeg'), // removes node_modules from your final bundle
	entry: './lib/main/cli.ts', // make sure this matches the main root of your code 
	output: {
		path: path.join(__dirname, 'dist'), // this can be any path and directory you want
		filename: './index.js',
	},
	optimization: {
		minimize: false, // enabling this reduces file size and readability
	},
	mode: 'production',
	module: {
		rules: [
			{
				test: /\.ts$/,
				exclude: [/node_modules/],
				loader: 'ts-loader'
			}
		]
	},
	plugins: [
		new ShebangPlugin(),
		// https://github.com/fluent-ffmpeg/node-fluent-ffmpeg/issues/573#issuecomment-305408048
		new webpack.DefinePlugin({
			'process.env.FLUENTFFMPEG_COV': false
		})
	],
	resolve: { extensions: [ '.js', '.ts', '.json' ] },
	ignoreWarnings: [
		{ module: /lib\/common\/require-module.ts/, },
		{ module: /node_modules\/fluent-ffmpeg\/lib\/options\/misc.js/, },
	],
};