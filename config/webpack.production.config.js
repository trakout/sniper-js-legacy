var CFG               = require('../config').prod;
var path              = require('path');
var webpack           = require('webpack');
var UglifyJsPlugin    = require('uglifyjs-webpack-plugin')
var CompressionPlugin = require("compression-webpack-plugin");


var targetMode = null
if (process.argv.indexOf("--target") != -1) {
  targetMode = process.argv[process.argv.indexOf("--target") + 1];
}


var nodeTargetConfig = {
  target: 'node',
  output: {
      path: path.join(__dirname, '../dist/'),
      publicPath: '/',
      filename: 'main.node.js',
      libraryTarget: 'commonjs-module'
  },
  resolve: {
    alias: {
      'scrypt.js': path.resolve(__dirname, '../node_modules/scrypt.js/js.js'),
      'sha3': path.resolve(__dirname, '../node_modules/sha3/build/Release/sha3.node'),
      '../build/Release/bufferutil': path.resolve(__dirname, '../node_modules/web3/node_modules/websocket/build/Release/bufferutil.node'),
      '../build/default/bufferutil': path.resolve(__dirname, '../node_modules/web3/node_modules/websocket/build/Release/bufferutil.node'),
      '../build/Release/validation': path.resolve(__dirname, '../node_modules/web3/node_modules/websocket/build/Release/validation.node'),
      '../build/default/validation': path.resolve(__dirname, '../node_modules/web3/node_modules/websocket/build/Release/validation.node'),
    },
  },
  performance: {
    hints: false
  },
  optimization: {
    minimize: false
  },
};


var defaultConfig = {
  mode: 'production',
  entry: [
    'babel-polyfill',
    './src/main.js'
  ],
  output: {
      path: path.join(__dirname, '../dist/'),
      publicPath: '/',
      filename: 'main.js',
      libraryTarget: 'commonjs-module'
  },
  module: {
    noParse: /node_modules\/web3/,
    rules: [
      {
        test: /\.node$/,
        use: 'node-loader'
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env'],
            compact: false,
            plugins: [
              'add-module-exports'
            ]
          }
        }
      }
    ]
  },
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        uglifyOptions: {
          beautify: false,
          compress: true,
          comments: false,
          mangle: {
            reserved: ['$super', '$', 'exports', 'require']
          },
          toplevel: false,
          keep_classnames: true,
          keep_fnames: true
        }
      })
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      },
      'CFG': JSON.stringify(CFG)
    }),
    new CompressionPlugin({
      algorithm: 'gzip',
      exclude: /main.node.js/,
    })
  ],
};


if (targetMode == 'node') {
  defaultConfig = Object.assign(
    {},
    defaultConfig,
    nodeTargetConfig
  )
}


module.exports = defaultConfig;
