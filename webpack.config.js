const path = require('path');
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
		extensions: [".ts", ".tsx", ".js", ".html"],
	},
	plugins: [
		new IgnorePlugin({
			resourceRegExp: /^pg-native$/,
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