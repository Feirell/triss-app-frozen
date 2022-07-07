const path = require("path");
const baseConfig = require("./webpack.common");

const rel = (str) => path.join(__dirname, str);

module.exports = {
  ...baseConfig,
  mode: "production",
};
