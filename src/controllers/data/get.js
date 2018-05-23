module.exports = async function getDocumentsById(req, res, next) {
  const {dataset, documentId} = req.params
  const documentIds = documentId.split(',')

  // @todo security
  const {dataStore} = req.app.services
  const store = await dataStore.forDataset(dataset)
  const documents = await store.getDocumentsById(documentIds)

  res.json({documents})
}
