var CFG               = require('../config').prod;
var path              = require('path');
var webpack           = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var CompressionPlugin = require("compression-webpack-plugin");

module.exports = {
  entry: [
    'babel-polyfill',
    './src/main'
  ],
  output: {
      path: path.join(__dirname, '../dist/'),
      publicPath: '/',
      filename: 'main.js'
  },
  debug: false,
  // devtool: 'source-map',
  module: {
    loaders: [
      {
        test: /\.pug$/,
        loaders: ["raw-loader", "pug-html-loader"]
      },
      {
        test: /\.js$/,
        include: path.join(__dirname, '../src'),
        loader: 'babel-loader',
        query: {
          presets: [
            'es2015'
          ]
        }
      },
      {
        test: /\.(ico?)(\?[a-z0-9=&.]+)?$/,
        loader: 'file-loader?name=./[name].[ext]'
      },
      {
        test: /\.json$/,
        loader: 'json-loader'
      },
      { test: /\.(glsl|frag|vert)$/, loader: 'raw', exclude: /node_modules/ },
      { test: /\.(glsl|frag|vert)$/, loader: 'glslify', exclude: /node_modules/ }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      },
      'CFG': JSON.stringify(CFG)
    }),
    // new webpack.optimize.CommonsChunkPlugin('common.js'),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        sequences: true,
        dead_code: true,
        conditionals: true,
        booleans: true,
        unused: true,
        if_return: true,
        join_vars: true,
        drop_console: true
      },
      mangle: {
        except: ['$super', '$', 'exports', 'require']
      },
      output: {
        comments: false
      }
    }),
    new webpack.optimize.AggressiveMergingPlugin(),
    new CompressionPlugin({
      algorithm: "gzip"
    })
  ],
  devServer: {
    contentBase: "./src"
  }
};
