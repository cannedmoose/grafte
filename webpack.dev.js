const merge = require ('webpack-merge');
const common = require ('./webpack.config.js');

module.exports = merge (common, {
  devtool: "source-map",
  mode: "development",
  watchOptions: {
    poll: 1000 // Check for changes every second
  }
});