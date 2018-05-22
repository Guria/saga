const pino = require('pino')
const express = require('express')
const bodyParser = require('body-parser')
const pkg = require('../package.json')

module.exports = config => {
  const log = pino({level: config.logLevel})

  const app = express()
  app.disable('x-powered-by')
  app.services = {log}

  app.get('/', (req, res) => res.json({service: pkg.name, version: pkg.version}))

  app.use(
    '/v1/data',
    bodyParser.json({limit: config.data.maxInputBytes}),
    require('./controllers/data')
  )

  app.use(
    '/v1/assets',
    bodyParser.raw({limit: config.assets.maxInputBytes}),
    require('./controllers/assets')
  )

  return app
}
