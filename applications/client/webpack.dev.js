const baseConfig = require("./webpack.common");

module.exports = {
  ...baseConfig,
  mode: "development",
  devtool: "source-map",
  devServer: {
    port: 3000,
    publicPath: "http://localhost:3000",
    // Only enable this if you think that you can make hot module replacement working.
    // I had no such case, so I just use a full page reload.
    // hot: true
  },
};
