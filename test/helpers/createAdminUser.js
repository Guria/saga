const getId = require('randomstring').generate
const createSession = require('./createSession')

module.exports = async (app, journalId) => {
  const identity = await app.services.userStore.createIdentity({
    provider: 'mock',
    providerId: 'adminId',
    name: 'Anonymous Admin',
    email: 'anon@ymous.com'
  })

  const user = await app.services.userStore.createAdminUser(identity, journalId)
  const sessionId = getId()
  const session = await createSession(app, sessionId, identity._id)

  return {identity, user, session, sessionId}
}
