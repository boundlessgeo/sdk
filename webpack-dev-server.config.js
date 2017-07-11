const webpack = require('webpack');
const path = require('path');

const ExtractTextPlugin = require('extract-text-webpack-plugin');

const config = {
  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      '@boundlessgeo/sdk': path.resolve(__dirname, 'src/'),
    }
  },
  // Entry points to the project
  entry: {
    basic: [
      'webpack/hot/only-dev-server',
      './examples/basic/app.jsx'
    ],
    wms: [
      './examples/wms/app.jsx',
    ],
  },
  // Server Configuration options
  devServer: {
    contentBase: './', // Relative directory for base of server
    hot: true, // Live-reload
    inline: true,
    port: 3000, // Port Number
    host: 'localhost', // Change to '0.0.0.0' for external facing server
  },
  devtool: 'eval',
  node: {fs: "empty"},
  output: {
    path: __dirname, // Path of output file
    filename: 'examples/[name]/[name].bundle.js',
  },
  plugins: [
    new ExtractTextPlugin('sdk.css'),
    // Enables Hot Modules Replacement
    new webpack.HotModuleReplacementPlugin(),
  ],
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          cacheDirectory: true,
        },
      }, {
        test: /\.s?css$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: ['css-loader', 'sass-loader']
        }),

      }
    ],
  },
};

module.exports = config;
