module.exports = async (req, res, next) => {
  const {dataset} = req.params
  const {securityManager} = req.app.services

  const userGrants = await securityManager.getFilterExpressionsForUser(
    dataset,
    req.user && req.user.id
  )
  const grants = userGrants.grants || {read: {}, update: {}, create: {}, delete: {}}
  const result = {
    read: grants.read,
    update: grants.update,
    create: grants.create,
    delete: grants.delete,
    capabilities: userGrants.capabilities || {}
  }
  res.json(result)
}
