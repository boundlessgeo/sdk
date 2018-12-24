const webpack = require('webpack');
const path = require('path');
const common  = require('./webpack-common');
const Config = require('dotenv').config();
const TerserPlugin = require('terser-webpack-plugin');

const entry = common.getEntries(false);

module.exports = {
  resolve: {
    alias: {
      '@boundlessgeo/sdk': path.resolve(__dirname, 'src/'),
    },
  },
  entry: entry,
  devtool: false,
  node: {fs: "empty"},
  output: {
    path: __dirname, // Path of output file
    // [name] refers to the entry point's name.
    filename: 'build/hosted/examples/[name]/[name].bundle.js',
  },
  plugins: [
    new TerserPlugin({
      sourceMap: false,
      terserOptions: {
        compress: {
          warnings: false,
          comparisons: false,  // don't optimize comparisons
        },
      },
    }),
    new webpack.DefinePlugin({
      MAPBOX_API_KEY: Config.parsed ? JSON.stringify(Config.parsed.MAPBOX_API_KEY) : undefined,
    }),
  ],
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules\/(?!(ol|ol-mapbox-style|@mapbox\/mapbox-gl-draw|@mapbox\/mapbox-gl-style-spec)\/).*/,
        loader: 'babel-loader',
        query: {
          cacheDirectory: true,
        },
      }, {
        test: /\.s?css$/,
        use: [ 'style-loader', 'css-loader', 'sass-loader' ]
      }
    ]
  },
}
