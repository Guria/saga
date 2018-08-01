// async function performQuery(dataset, query, params = {}) {
//   try {
//     const store = await dataStore.forDataset(dataset)
//     const results = await store.fetch(query, params, {globalFilter: globalFilters.read})
//     return typeof results === 'undefined' ? [] : results
//   } catch (err) {
//     return err
//   }
// }

function lookup() {
  return null
}

module.exports = async (identityId, venueId, options = {}) => {
  await lookup(identityId, venueId, options.dataStore)
  const accessFilters = Object.assign({}, options.defaultFilters)
  return accessFilters
}
