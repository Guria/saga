import parse from '../../groq/parse'

module.exports = async (req, res, next) => {
  const {dataset} = req.params
  const {securityManager} = req.app.services

  const userGrants = await securityManager.getFilterExpressionsForUser(
    dataset,
    req.user && req.user.id
  )
  const result = {capabilities: userGrants.capabilities}
  result.read = parse(userGrants.read, {})
  result.update = parse(userGrants.update, {})
  result.delete = parse(userGrants.delete, {})
  result.create = parse(userGrants.create, {})
  res.json(result)
}
