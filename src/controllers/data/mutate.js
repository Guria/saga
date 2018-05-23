const MutationSet = require('../../datastore/MutationSet')

module.exports = async (req, res, next) => {
  const {dataset} = req.params
  const {dataStore} = req.app.services
  const {mutations, transactionId} = req.body
  const store = await dataStore.forDataset(dataset)
  const mutationSet = new MutationSet(mutations, {transactionId})
  const results = await mutationSet.execute(store)
  res.json(results)
}
