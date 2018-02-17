var path              = require('path');
var webpack           = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var DashboardPlugin   = require('webpack-dashboard/plugin');

var HOST = 'http://127.0.0.1:9000/';

module.exports = {
  entry: [
    'babel-polyfill',
    './src/main',
    'webpack-dev-server/client?' + HOST
  ],
  output: {
      publicPath: HOST,
      filename: 'main.[hash].js'
  },
  debug: true,
  devtool: 'eval-source-map',
  resolve: {
    root: [
      path.resolve('./node_modules'),
      path.resolve('./src')
    ]
  },
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
        loader: 'style!css?sourceMap!autoprefixer!stylus-loader'
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
    // new webpack.HotModuleReplacementPlugin(),
    new HtmlWebpackPlugin({
      template: './src/index.pug'
    }),
    new DashboardPlugin()
  ],
  devServer: {
    // hot: true,
    host: '0.0.0.0',
    port: 9000,
    open: true,
    contentBase: "./src"
  }
};
