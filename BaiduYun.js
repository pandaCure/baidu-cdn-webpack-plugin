const { BosClient, Q } = require('@baiducloud/sdk')
const async = require('async')
class BaiDuYun {
  constructor(ak, sk, endpoint) {
    this.BaiDuYunCli = new BosClient({
      credentials: {
        ak,
        sk
      },
      endpoint
    })
  }
  uploadCDNFile(bucket, object, buffer) {
    return new Promise((resolve, reject) => {
      this.BaiDuYunCli.putObject(bucket, object, buffer)
        .then(resolve)
        .catch(reject)
    })
  }
  /**
   * @param {string} bucket // 文件夹名称
   * @param {string} filePath // 文件所在路径
   * @param {string} key // 文件名称带后缀
   * @param {number} fileSize // 文件大小
   */
  uploadMultipartFile(bucket, filePath, fileName, fileSize) {
    return new Promise((resolve, reject) => {
      let PART_SIZE = 3 * 1024 * 1024 // 指定分块大小
      let uploadId
      this.BaiDuYunCli.initiateMultipartUpload(bucket, fileName, {})
        .then((response) => {
          uploadId = response.body.uploadId
          let deferred = Q.defer()
          let tasks = getTasks(
            filePath,
            uploadId,
            bucket,
            fileName,
            PART_SIZE,
            fileSize
          )
          let state = {
            lengthComputable: true,
            loaded: 0,
            total: tasks.length
          }
          let THREADS = 2 // 同时上传的分块数量
          async.mapLimit(
            tasks,
            THREADS,
            uploadPartFile(state, this.BaiDuYunCli, console.log),
            function (err, results) {
              if (err) {
                deferred.reject(err)
              } else {
                deferred.resolve(results)
              }
            }
          )
          return deferred.promise
        })
        .then((allResponse) => {
          // Your proposed upload is smaller than the minimum allowed object size
          let partList = []
          allResponse.forEach(function (response, index) {
            // 生成分块清单
            partList.push({
              partNumber: index + 1,
              eTag: response.http_headers.etag
            })
          })
          return this.BaiDuYunCli.completeMultipartUpload(
            bucket,
            fileName,
            uploadId,
            partList
          ) // 完成上传
        })
        .then(function (res) {
          console.log('   上传完成   ')
          resolve(res)
        })
        .catch(function (err) {
          console.log('   上传失败   ')
          reject(err)
        })
    })
  }
}
function getTasks(filePath, uploadId, bucketName, fileName, size, fileSize) {
  let leftSize = fileSize
  let offset = 0
  let partNumber = 1

  let tasks = []

  while (leftSize > 0) {
    let partSize = Math.min(leftSize, size)
    tasks.push({
      file: filePath,
      uploadId: uploadId,
      bucketName: bucketName,
      key: fileName,
      partNumber: partNumber,
      partSize: partSize,
      start: offset,
      stop: offset + partSize - 1
    })

    leftSize -= partSize
    offset += partSize
    partNumber += 1
  }
  return tasks
}
function uploadPartFile(state, client) {
  return function (task, callback) {
    return client
      .uploadPartFromFile(
        task.bucketName,
        task.key,
        task.uploadId,
        task.partNumber,
        task.partSize,
        task.file,
        task.start
      )
      .then(function (res) {
        ++state.loaded
        callback(null, res)
      })
      .catch(function (err) {
        callback(err)
      })
  }
}
module.exports = BaiDuYun
