const cors = require('cors')
const pino = require('pino')
const express = require('express')
const bodyParser = require('body-parser')
const {errors} = require('celebrate')
const pkg = require('../package.json')
const errorHandler = require('./middleware/errorHandler')
const StoreManager = require('./datastore/StoreManager')
const getFileStore = require('./filestore')

module.exports = config => {
  const log = pino({level: config.logLevel})
  const fileStore = getFileStore(config.assets)
  const dataStore = new StoreManager(config.datastore)

  const app = express()
  app.disable('x-powered-by')
  app.services = {log, config, fileStore, dataStore}

  app.use(cors(config.cors))

  app.get('/', (req, res) => res.json({service: pkg.name, version: pkg.version}))

  app.use(
    '/v1/data',
    bodyParser.json({limit: config.data.maxInputBytes}),
    require('./controllers/data')
  )

  app.use(
    '/v1/assets',
    bodyParser.raw({limit: config.assets.maxInputBytes, type: () => true}),
    require('./controllers/assets/upload')
  )

  app.use(
    '/v1/users',
    bodyParser.json({limit: config.data.maxInputBytes}),
    require('./controllers/users')
  )

  app.use(require('./controllers/assets/serve'))

  app.use(errors())
  app.use(errorHandler)

  return app
}
