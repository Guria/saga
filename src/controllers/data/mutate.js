const {omit} = require('lodash')

module.exports = async (req, res, next) => {
  const {dataset} = req.params
  const {dataStore} = req.app.services
  const {returnIds, returnDocuments} = req.query
  const {mutations, transactionId} = req.body
  const identity = req.user && req.user.id

  const store = await dataStore.forDataset(dataset)
  const trx = store.newTransaction({transactionId, mutations, identity})

  let commitResult
  try {
    commitResult = await trx.commit()
  } catch (err) {
    return next(err)
  }

  const {results, ...rest} = commitResult

  if (returnIds && returnDocuments) {
    return res.json({results, ...rest})
  }

  const omitProps = [!returnIds && 'id', !returnDocuments && 'document'].filter(Boolean)
  const mappedResults = results.map(result => omit(result, omitProps))
  return res.json({results: mappedResults, ...rest})
}
