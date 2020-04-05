const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const WriteFilePlugin = require("write-file-webpack-plugin");

module.exports = {
  mode: "development",
  devtool: "source-map",
  entry: "./src/main.ts",
  devServer: {
    contentBase: "./build"
  },
  plugins: [
    new CopyPlugin([{ from: "static", to: "." }]),
    new WriteFilePlugin()
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: [
          "style-loader",
          { loader: "css-loader", options: { importLoaders: 1 } }
        ]
      }
    ]
  },
  resolve: {
    extensions: [".ts", ".js"]
  },
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "build")
  }
};
