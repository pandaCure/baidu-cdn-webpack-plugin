const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')
const UploadCdnWebpackPlugin = require('./cdn')
module.exports = {
  entry: {
    app: './src/index.js'
  },
  output: {
    filename: '[name].[chunkhash:8].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: 'https://xxx.nnn.com'
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'cdn.html',
      template: './index.html',
      inject: true
    }),
    new UploadCdnWebpackPlugin({
      lodash: {
        relativePath: 'lodash.min.js',
        name: 'lodash',
        version: '4.17.20'
      }
    })
  ],
  externals: {
    lodash: 'lodash'
  },
  mode: 'development'
}
