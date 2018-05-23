const path = require('path')
const fse = require('fs-extra')

module.exports = class FsFileStore {
  constructor(config) {
    this.config = config
    this.options = config.options
  }

  getPath(dstPath) {
    return path.join(this.options.basePath, dstPath)
  }

  read(srcPath) {
    return fse.readFile(this.getPath(srcPath))
  }

  write(dstPath, content) {
    return fse.outputFile(this.getPath(dstPath), content)
  }

  delete(dstPath) {
    return fse.remove(this.getPath(dstPath))
  }

  list(dstPath) {
    return fse.readdir(this.getPath(dstPath))
  }
}
