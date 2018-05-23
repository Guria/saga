const Store = require('../../datastore/Store')

module.exports = async function getDocumentsById(req, res, next) {
  const {dataset, documentId} = req.params
  const documentIds = documentId.split(',')

  // @todo security
  const store = await Store.forDataset(dataset)
  const documents = await store.getDocumentsById(documentIds)

  res.json({documents})
}
