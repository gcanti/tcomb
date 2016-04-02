var webpack = require('webpack');
var path = require('path');
var library = 'Tcomb';

module.exports = [
  {
    devtool: 'source-map',
    entry: './index.js',
    output: {
      path: path.resolve(__dirname, './dist'),
      filename: 'tcomb.js',
      library: library,
      libraryTarget: 'umd'
    },
    plugins: [
      new webpack.DefinePlugin({ 'process.env.NODE_ENV': JSON.stringify('development') })
    ]
  },
  {
    devtool: 'source-map',
    entry: './index.js',
    output: {
      path: path.resolve(__dirname, './dist'),
      filename: 'tcomb.min.js',
      library: library,
      libraryTarget: 'umd'
    },
    plugins: [
      new webpack.DefinePlugin({ 'process.env.NODE_ENV': JSON.stringify('production') }),
      new webpack.optimize.UglifyJsPlugin({ compress: { warnings: false } })
    ]
  }
];
