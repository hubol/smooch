const path = require('path');
const ShebangPlugin = require('webpack-shebang-plugin');
const webpack = require('webpack');

/**
 * @type {import('webpack').Configuration}
 */
module.exports = {
	target: 'node',
	entry: './lib/main/cli.ts',
	output: {
		path: path.join(__dirname, 'dist'),
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
		{ module: /node_modules\/prettier\/index.mjs/, },
	],
};