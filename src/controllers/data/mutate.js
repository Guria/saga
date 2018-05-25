module.exports = async (req, res, next) => {
  const {dataset} = req.params
  const {dataStore} = req.app.services
  const {mutations, transactionId} = req.body
  const store = await dataStore.forDataset(dataset)
  const trx = store.newTransaction({transactionId, mutations})
  const results = await trx.commit()
  res.json(results)
}
