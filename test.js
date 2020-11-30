const path = require('path')
const fs = require('fs')
var Blob = require('node-blob')
const config = require('./config')
const BaiDuYun = require('./BaiduYun')
const uploadTool = new BaiDuYun(
  config.AccessKeyID,
  config.AccessKeySecret,
  config.EndPoint
)
const packagePath = path.join(
  process.cwd(),
  'node_modules',
  'lodash/lodash.min.js'
)
// console.log(packagePath)
const packageJson = require(packagePath)
// console.log(packageJson)
let fileBuffer = fs.readFileSync(packagePath, {
  encoding: 'binary'
})
// fileBuffer = new Blob([fileBuffer], { type: 'application/octet-stream' })
// let buffer = Buffer.from(fileBuffer)
// fileBuffer = Uint8Array.from(buffer).buffer
console.log(fileBuffer.length)
// console.table(fileBuffer)
const name = `ss-gg-ww.js`
// console.log(fileBuffer)
uploadTool.uploadMultipartFile(
  config.bucket,
  packagePath,
  name,
  fs.statSync(packagePath).size
)
