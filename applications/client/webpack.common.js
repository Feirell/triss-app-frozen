const path = require("path");
const fs = require("fs");

const {MODELS_BASE_PATH} = require("@triss/models");

const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");

const rel = (str) => path.join(__dirname, str);

const babelConfig = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "./.babelrc"))
);

const MiniCssExtractPluginLoader = MiniCssExtractPlugin.loader;

const makeRegExt = pattern => function({context, request}, callback) {
  if (pattern.test(request)) {
    // Externalize to a commonjs module using the request path
    return callback(null, "commonjs " + request);
  }

  // Continue without externalizing the import
  callback();
};

const resDir = "res";

module.exports = {
  name: "base",
  entry: ["./src/index.ts"],
  externals: [
    makeRegExt(/^node:.+$/)
  ],
  resolve: {extensions: ["*", ".js", ".jsx", ".ts", ".tsx", ".woff2"]},
  plugins: [
    new MiniCssExtractPlugin({
      filename: resDir + "/main-bundle.css"
    }),
    new HtmlWebpackPlugin({
      template: "public/index.html",
      filename: "index.html"
    }),
    new CopyPlugin({
      patterns: [
        {
          from: MODELS_BASE_PATH,
          to: resDir + "/models",
          filter: p => /\.glb$/i.test(p)
        }
      ]
    })
  ],
  output: {
    path: rel("../../dist/client/"),
    // publicPath: "/" + resDir + "/",
    filename: resDir + "/[name]-bundle.js",
    assetModuleFilename: resDir + "/[name][ext]"
  },
  optimization: {
    splitChunks: {
      chunks: "all",
      minSize: 20000,
      minRemainingSize: 0,
      minChunks: 1,
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      enforceSizeThreshold: 50000,
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          reuseExistingChunk: true,
          name: "vendor"
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true
        }
      }
    }
  },
  module: {
    rules: [
      {
        test: /\.m?[tj]sx?$/i,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            ...babelConfig
          }
        }
      },
      {
        test: /\.woff2?$/,
        type: "asset/resource"
      },
      {
        test: /\.css$/i,
        type: "asset/resource",
        use: [
          {loader: MiniCssExtractPluginLoader},
          {loader: "css-loader"}
        ]
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          {loader: MiniCssExtractPluginLoader},
          {loader: "css-loader"},
          {loader: "resolve-url-loader"},
          {
            loader: "sass-loader",
            options: {
              sourceMap: true
            }
          }
        ]
      }
    ]
  }
};
