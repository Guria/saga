const Store = require('../../datastore/Store')
const MutationSet = require('../../datastore/MutationSet')

module.exports = async (req, res, next) => {
  const {dataset} = req.params
  const {mutations, transactionId} = req.body
  const store = await Store.forDataset(dataset)
  const mutationSet = new MutationSet(mutations, {transactionId})
  const results = await mutationSet.execute(store)
  res.json(results)
}
