module.exports = async (req, res, next) => {
  const {dataset} = req.params
  const {securityManager} = req.app.services

  const userGrants = await securityManager.getFilterExpressionsForUser(
    dataset,
    req.user && req.user.id
  )
  res.json(userGrants)
}
