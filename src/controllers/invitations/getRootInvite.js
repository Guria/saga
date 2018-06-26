module.exports = async (req, res, next) => {
  const {userStore} = req.app.services
  const rootInvite = await userStore.getRootInvite()
  if (rootInvite) {
    res.json(rootInvite._id)
    return
  }

  const hasRootUser = await userStore.hasRootUser()
  if (hasRootUser) {
    res.json(null)
    return
  }

  const inviteId = await userStore.createRootUser()
  res.json(inviteId)
}
