const fse = require('fs-extra')

module.exports = async app => {
  await app.services.dataStore.closeAll()
  await fse.remove(app.services.config.assets.options.basePath)
}
