const fs = require('fs')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')
const BaiDuYun = require('./BaiduYun')
// const config = require('./config')
// const uploadTool = new BaiDuYun(
//   config.AccessKeyID,
//   config.AccessKeySecret,
//   config.EndPoint
// )
let cdnNameSource = new Set()
class UploadCdnWebpackPlugin {
  constructor(cdnExternals, config) {
    this.cdnExternals = cdnExternals
    this.config = config
    this.uploadTool = new BaiDuYun(
      config.AccessKeyID,
      config.AccessKeySecret,
      config.EndPoint
    )
  }
  apply(compiler) {
    compiler.hooks.compilation.tap(
      'UploadCdnWebpackPlugin',
      (compilation, compilationParams) => {
        console.log(compilationParams)
        const webpackExternals = compiler.options.externals
        const publicPath = compilation.options.output.publicPath
        // console.log(compilation.options.output.publicPath)
        Object.keys(webpackExternals).forEach(async (packageName) => {
          try {
            if (!this.cdnExternals.hasOwnProperty(packageName)) {
              console.clear()
              console.error('不存在这个：：：：', packageName)
              process.exit(1)
            }
            const packageInfo = this.cdnExternals[packageName]
            const packagePath = path.join(
              process.cwd(),
              'node_modules',
              packageName,
              packageInfo.relativePath
            )
            const name = `${packageInfo.name}-${packageInfo.version}-${packageInfo.relativePath}`
            console.log(`${publicPath}/${name}`)
            cdnNameSource.add(`${publicPath}/${name}`)
            await this.uploadTool.uploadMultipartFile(
              this.config.bucket,
              packagePath,
              name,
              fs.statSync(packagePath).size
            )
          } catch (error) {
            console.error(error)
          }
        })
        HtmlWebpackPlugin.getHooks(compilation).afterTemplateExecution.tapAsync(
          'UploadCdnWebpackPlugin',
          (data, cb) => {
            console.log(JSON.stringify(data.bodyTags))
            cdnNameSource.forEach((url) => {
              console.log(url)
              data.headTags = [
                ...data.headTags,
                {
                  tagName: 'script',
                  voidTag: false,
                  attributes: { defer: false, src: url }
                }
              ]
            })
            cb(null, data)
          }
        )
      }
    )
  }
}
module.exports = UploadCdnWebpackPlugin
