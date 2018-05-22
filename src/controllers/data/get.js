const getDocuments = (dataset, ids) => []

module.exports = function getDocumentsById(req, res, next) {
  const {datasetName, documentId} = req.params
  const documentIds = documentId.split(',')

  const documents = getDocuments(datasetName, documentIds)

  res.json({documents})
}
