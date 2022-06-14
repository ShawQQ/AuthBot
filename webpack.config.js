const path = require('path');
const Dotenv = require('dotenv-webpack');
const { IgnorePlugin } = require('webpack');

module.exports = {
	target: "node",
	mode: "development",
	devtool: "inline-source-map",
	entry: {
		main: "./src/index.ts",
	},
	output: {
		path: path.resolve(__dirname, './dist'),
		filename: "build-bundle.js"
	},
	resolve: {
		extensions: [".ts", ".js"],
	},
	plugins: [
		new IgnorePlugin({
			resourceRegExp: /^pg-native$/,
		}),
		new Dotenv({
			systemvars: true
		})
	],
	module: {
		rules: [
			{ 
				test: /\.tsx?$/,
				loader: "ts-loader"
			}
		]
	}
};