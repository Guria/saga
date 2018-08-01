const {noAccessFilterExpressions, fullAccessFilterExpressions} = require('./defaultFilters')

async function performQuery(dataStore, query, params = {}) {
  try {
    const results = await dataStore.fetch(query, params)
    return typeof results === 'undefined' ? [] : results
  } catch (err) {
    console.error('☠ performQuery failed', err, query) // eslint-disable-line no-console
    return err
  }
}

async function determineFilters(userId, dataStore) {
  const venueAccessQuery = `*[_type=="venue" && references($userId)][0]{
    _id, _type,
    "administrator": defined(administrators) && length(administrators[_ref == $userId])>0,
  }`
  const params = {userId}
  const result = await performQuery(dataStore, venueAccessQuery, params)
  console.log('Got result', JSON.stringify(result, null, 2))
  return result.administrator ? fullAccessFilterExpressions : noAccessFilterExpressions
}

module.exports = async (userId, dataStore) => {
  const accessFilters = await determineFilters(userId, dataStore)
  return accessFilters
}
