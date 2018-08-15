const render = require('./views/login')
const fse = require('fs-extra')

const withUrl = ({baseUrl, origin}) => provider => ({
  ...provider,
  url: `${baseUrl}/v1/auth/login/${provider.name}?origin=${encodeURIComponent(origin)}`
})

module.exports = async (providers, req, res) => {
  const {userStore} = req.app.services
  const rootInvite = await userStore.getRootInvite()

  if (rootInvite && (rootInvite.isAccepted || rootInvite.isRevoked)) {
    res.send('Invite already claimed')
    return
  }

  const inviteId = await getOrCreateRootInviteId()

  const baseUrl = `${req.protocol}://${req.headers.host}`
  res.type('text/html; charset=utf-8').send(
    render({
      script: await browserScript,
      providers: providers.map(
        withUrl({
          origin: `${baseUrl}/v1/invitations/claim/${inviteId}`,
          baseUrl
        })
      )
    })
  )

  async function getOrCreateRootInviteId() {
    return (await userStore.getRootInvite()._id) || userStore.createRootUser()
  }
}
