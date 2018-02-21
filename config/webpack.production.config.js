var CFG               = require('../config').prod;
var path              = require('path');
var webpack           = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
  entry: [
    'babel-polyfill',
    './src/main'
  ],
  output: {
      path: path.join(__dirname, '../dist/'),
      publicPath: '/',
      filename: 'main.[hash].js'
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
        test: /\.(ttf|eot|svg|woff(2)?)(\?[a-z0-9=&.]+)?$/,
        loader: 'file-loader?name=./asset/[hash].[ext]' // disable hashing
      },
      {
        test: /\.(png|jpg?)(\?[a-z0-9=&.]+)?$/,
        loader: 'file-loader?name=./asset/[name].[ext]'
      },
      {
        test: /\.(ico?)(\?[a-z0-9=&.]+)?$/,
        loader: 'file-loader?name=./[name].[ext]'
      },
      {
        test: /\.styl$/,
        loader: ExtractTextPlugin.extract("css!autoprefixer!stylus-loader")
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
      }
      // 'CFG': JSON.stringify(CFG)
    }),
    new webpack.optimize.CommonsChunkPlugin('common.js'),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin(),
    new webpack.optimize.AggressiveMergingPlugin(),
    new ExtractTextPlugin('[name].[hash].css')
  ],
  devServer: {
    contentBase: "./src"
  }
};
