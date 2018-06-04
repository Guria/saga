const passport = require('passport')
const providersFallback = require('../../config/oauth.fallback.json')
const handleLogin = require('./handleLogin')

module.exports = function applyStrategies(app, config) {
  const {userStore, log} = app.services

  passport.serializeUser((user, done) => {
    log.info(`Serializing user to ${user._id}`)
    done(null, `${user._id}`)
  })

  passport.deserializeUser(async (id, done) => {
    log.info(`Fetching users for identity ${id}`)
    const [identity, users] = await Promise.all([
      userStore.fetchIdentityById(id),
      userStore.fetchUsersForIdentity(id)
    ])

    log.info(`Found %d users`, users ? users.length : 0)
    done(null, {id, identity, users})
  })

  let providers

  try {
    providers = require(config.auth.providersConfigPath)
  } catch (err) {
    if (config.auth.providersConfigPath !== config.DEFAULT_AUTH_PROVIDER_CONFIG_PATH) {
      throw err
    }
  }

  if ((config.env === 'production' || config.env === 'staging') && !providers) {
    app.services.log.warn('No OAuth configuration provided, using fallback')
  }

  providers = providers || providersFallback

  return providers.map(provider => {
    const Strategy =
      config.env === 'test'
        ? require('passport-mocked').Strategy
        : require(`passport-${provider.strategy}`).Strategy

    passport.use(new Strategy(provider.config, handleLogin.bind(null, app, provider)))
    return provider
  })
}