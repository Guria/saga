const Store = require('../../datastore/Store')
const MutationSet = require('../../datastore/MutationSet')

module.exports = async (req, res, next) => {
  const {dataset} = req.params
  const store = await Store.forDataset(dataset)
  const mutations = new MutationSet(req.body.mutations)
  const results = await mutations.execute(store)
  res.json(results)
}
