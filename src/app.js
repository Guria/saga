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
const SecurityManager = require('./security/SecurityManager')
const applyAuthStrategies = require('./authentication/applyStrategies')
const UserStore = require('./userstore')
const getFileStore = require('./filestore')

module.exports = config => {
  const log = pino({level: config.logLevel})
  const fileStore = getFileStore(config.assets)
  const dataStore = new StoreManager(config.datastore)
  const userStore = new UserStore({dataStore, db: config.datastore.options.systemDb})
  const securityManager = new SecurityManager({userStore})
  const sessionStore = new MongoStore({
    ...config.sessionStore,
    dbPromise: dataStore.connect().then(client => client.db(config.datastore.options.systemDb))
  })

  const sessionParser = session({...config.session, store: sessionStore})

  dataStore.setSecurityManager(securityManager)
  dataStore.on('mutation', securityManager.onMutation)

  const app = express()
  app.services = {
    log,
    config,
    sessionStore,
    fileStore,
    dataStore,
    userStore,
    sessionParser,
    securityManager
  }

  app.disable('x-powered-by')
  app.set('trust proxy', 1)
  app.use(sessionParser)
  app.use(cookieParser())
  app.use(cors(config.cors))
  app.use(passport.initialize())
  app.use(passport.session())

  app.get('/', (req, res) => res.json({service: pkg.name, version: pkg.version}))

  app.get('/v1/ping', (req, res) => res.json({pong: true}))
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
    '/v1/invitations',
    bodyParser.json({limit: config.data.maxInputBytes}),
    require('./controllers/invitations')
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

  if (config.env !== 'test') {
    checkRootUser(app.services)
  }

  return app
}

function getClaimUrl(baseUrl, invite) {
  return `${baseUrl}/invitations/claim/${invite._id}`
}

/* eslint-disable no-console */
async function checkRootUser(services) {
  const {userStore, config} = services
  const baseUrl = `http://localhost:${config.port}/v1`

  const rootInvite = await userStore.getRootInvite()
  if (rootInvite) {
    const claimUrl = getClaimUrl(baseUrl, rootInvite)
    console.log(`No root user found, visit:`)
    console.log(`Login: ${baseUrl}/auth/login/google`)
    console.log(`Claim admin: ${claimUrl}`)
    return
  }

  const hasRootUser = await userStore.hasRootUser()
  if (hasRootUser) {
    return
  }

  const inviteId = await userStore.createRootUser()
  const claimUrl = getClaimUrl(baseUrl, {_id: inviteId})
  console.log(`No root user found, visit:`)
  console.log(`Login: ${baseUrl}/auth/login/google`)
  console.log(`Claim admin: ${claimUrl}`)
}
/* eslint-enable no-console */
