const cors = require('cors')
const pino = require('pino')
const {errors} = require('celebrate')
const passport = require('passport')
const express = require('express')
const session = require('express-session')
const bodyParser = require('body-parser')
const MongoStore = require('connect-mongo')(session)
const cookieParser = require('cookie-parser')
const pkg = require('../package.json')
const errorHandler = require('./middleware/errorHandler')
const StoreManager = require('./datastore/StoreManager')
const applyAuthStrategies = require('./authentication/applyStrategies')
const UserStore = require('./userstore')
const getFileStore = require('./filestore')

module.exports = config => {
  const log = pino({level: config.logLevel})
  const fileStore = getFileStore(config.assets)
  const dataStore = new StoreManager(config.datastore)
  const userStore = new UserStore({dataStore})
  const sessionStore = new MongoStore({
    ...config.sessionStore,
    dbPromise: dataStore.connect().then(client => client.db('_lyra_system_'))
  })

  const sessionParser = session({...config.session, store: sessionStore})

  const app = express()
  app.services = {log, config, fileStore, dataStore, userStore, sessionParser}
  app.disable('x-powered-by')
  app.set('trust proxy', 1)
  app.use(sessionParser)
  app.use(cookieParser())
  app.use(cors(config.cors))
  app.use(passport.initialize())
  app.use(passport.session())

  app.get('/', (req, res) => res.json({service: pkg.name, version: pkg.version}))

  app.get('/v1/versions', require('./controllers/versions'))

  app.use(
    '/v1/auth',
    bodyParser.json({limit: config.data.maxInputBytes}),
    require('./controllers/auth')(applyAuthStrategies(app, config))
  )

  app.use(
    '/v1/users',
    bodyParser.json({limit: config.data.maxInputBytes}),
    require('./controllers/users')
  )

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

  app.use(require('./controllers/assets/serve'))

  app.use(errors())
  app.use(errorHandler)

  return app
}
