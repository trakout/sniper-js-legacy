var CFG               = require('../config').dev;
var path              = require('path');
var webpack           = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var DashboardPlugin   = require('webpack-dashboard/plugin');

var HOST = 'http://127.0.0.1:9000/';


module.exports = {
  mode: 'development',
  entry: [
    'babel-polyfill',
    './src/main',
    'webpack-dev-server/client?' + HOST
  ],
  output: {
    publicPath: HOST,
    filename: 'main.[hash].js'
  },
  devtool: 'eval-source-map',
  devServer: {
    // hot: true,
    compress: true,
    port: 9000,
    contentBase: "./src"
  },
  // resolve: {
  //   modules: [
  //     path.resolve('./node_modules'),
  //     path.resolve('./src')
  //   ]
  // },
  module: {
    rules: [
      {
        test: /\.pug$/,
        use: ['raw-loader', 'pug-html-loader']
      },
      {
        test: /\.js$/,
        include: path.join(__dirname, '../src'),
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env']
          }
        }
      },
      {
        test: /\.(ttf|eot|svg|woff(2)?)(\?[a-z0-9=&.]+)?$/,
        use: 'file-loader?name=./asset/[hash].[ext]' // disable hashing
      },
      {
        test: /\.(png|jpg?)(\?[a-z0-9=&.]+)?$/,
        use: 'file-loader?name=./asset/[name].[ext]'
      },
      {
        test: /\.(ico?)(\?[a-z0-9=&.]+)?$/,
        use: 'file-loader?name=./[name].[ext]'
      },
      {
        test: /\.styl$/,
        use: 'style!css?sourceMap!autoprefixer!stylus-loader'
      },
      {
        test: /\.(glsl|frag|vert)$/,
        use: 'raw',
        exclude: /node_modules/
      },
      {
        test: /\.(glsl|frag|vert)$/,
        use: 'glslify',
        exclude: /node_modules/
      },
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'CFG': JSON.stringify(CFG)
    }),
    new HtmlWebpackPlugin({
      template: './src/index.pug'
    }),
    new DashboardPlugin()
  ]
};
