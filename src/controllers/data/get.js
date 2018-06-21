module.exports = async function getDocumentsById(req, res, next) {
  const {dataset, documentId} = req.params
  const {dataStore, securityManager} = req.app.services

  const documentIds = documentId.split(',')
  const globalFilters = await securityManager.getFilterExpressionsForUser(
    dataset,
    req.user && req.user.id
  )

  const query = '*[_id in $ids]'
  const params = {ids: documentIds}

  let documents
  try {
    const store = await dataStore.forDataset(dataset)
    const results = await store.fetch(query, params, {globalFilter: globalFilters.read})
    documents = typeof results === 'undefined' ? [] : results
  } catch (err) {
    next(err)
    return
  }

  res.json({documents})
}
