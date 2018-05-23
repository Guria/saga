const cors = require('cors')
const pino = require('pino')
const express = require('express')
const bodyParser = require('body-parser')
const pkg = require('../package.json')
const errorHandler = require('./middleware/errorHandler')

module.exports = config => {
  const log = pino({level: config.logLevel})

  const app = express()
  app.disable('x-powered-by')
  app.services = {log, config}

  app.use(cors(config.cors))

  app.get('/', (req, res) => res.json({service: pkg.name, version: pkg.version}))

  app.use(
    '/v1/data',
    bodyParser.json({limit: config.data.maxInputBytes}),
    require('./controllers/data')
  )

  app.use(
    '/v1/assets',
    bodyParser.raw({limit: config.assets.maxInputBytes}),
    require('./controllers/assets/upload')
  )

  app.use(
    '/v1/users',
    bodyParser.json({limit: config.data.maxInputBytes}),
    require('./controllers/users')
  )

  app.use(require('./controllers/assets/serve'))

  app.use(errorHandler)

  return app
}
