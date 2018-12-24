const webpack = require('webpack');
const path = require('path');
const common  = require('./webpack-common');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const Config = require('dotenv').config();

const entry = common.getEntries(true);

const config = {
  resolve: {
    alias: {
      '@boundlessgeo/sdk': path.resolve(__dirname, 'src/'),
    },
  },
  // Entry points to the project
  entry: entry,
  // Server Configuration options
  devServer: {
    contentBase: './', // Relative directory for base of server
    hot: true, // Live-reload
    inline: true,
    port: 3000, // Port Number
    host: 'localhost', // Change to '0.0.0.0' for external facing server
    proxy: {
      '/geoserver' : {
        target: 'http://localhost:8080/',
        secure: false,
      }
    },
  },
  devtool: 'cheap-module-source-map',
  node: {fs: "empty"},
  output: {
    path: __dirname, // Path of output file
    // [name] refers to the entry point's name.
    filename: 'build/examples/[name]/[name].bundle.js',
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "build/examples/[name]/[name].bundle.css",
    }),
    // Enables Hot Modules Replacement
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({
      MAPBOX_API_KEY: Config.parsed ? JSON.stringify(Config.parsed.MAPBOX_API_KEY) : undefined,
    }),
  ],
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules\/(?!(@mapbox\/mapbox-gl-style-spec)\/).*/,
        loader: 'babel-loader',
        query: {
          cacheDirectory: true,
        },
      }, {
        test: /\.s?css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', {
          loader: 'sass-loader',
          options: {
            includePaths: ['node_modules'],
          }
        }],
      }
    ],
  },
};

module.exports = config;
