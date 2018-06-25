const Boom = require('boom')
const SecurityManager = require('../../security/SecurityManager')

module.exports = async (req, res, next, invite) => {
  const {dataStore, userStore} = req.app.services
  const {journalId, origin} = req.query

  const identity = await userStore.createIdentity({
    provider: 'vega-guest',
    providerId: invite.target._ref,
    name: 'Anonymous Aardvark'
  })

  const store = await (journalId ? dataStore.forDataset(journalId) : userStore.connect())
  await userStore.claimUser(invite.target._ref, identity._id, journalId, identity)
  await store
    .newTransaction({identity: SecurityManager.SYSTEM_IDENTITY})
    .patch(invite._id, patch => patch.set({isAccepted: true}))
    .commit()

  // Sign user in as the created identity
  req.login(identity, err => {
    if (err) {
      next(Boom.internal(err))
      return
    }

    // Ensure session has been saved before redirecting
    req.session.save(() => res.redirect(origin || '/v1/users/me'))
  })
}
