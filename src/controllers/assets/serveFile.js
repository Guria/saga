const path = require('path')
const pump = require('pump')
const FsFileStore = require('../../filestore/fs/fsFileStore')

module.exports = (req, res, next) => {
  const fileStore = req.app.services.fileStore
  const filePath = path.join('files', 'vega', req.url)

  if (fileStore instanceof FsFileStore) {
    res.sendFile(path.join(fileStore.getBasePath(), filePath))
  } else {
    pump(fileStore.getReadStream(req.url), res, err => {
      req.app.services.warn(err)
    })
  }
}
