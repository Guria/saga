const path = require('path')

module.exports = (req, res, next) => {
  const config = req.app.services.config
  const basePath = config.assets.options.basePath
  res.sendFile(path.join(basePath, 'images', 'vega.png'))
}
