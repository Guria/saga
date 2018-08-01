async function performQuery(dataStore, query, params = {}) {
  try {
    const results = await dataStore.fetch(query, params)
    return typeof results === 'undefined' ? [] : results
  } catch (err) {
    console.error('☠ performQuery failed', err, query) // eslint-disable-line no-console
    return err
  }
}

async function lookup(userId, dataStore) {
  const venueAccessQuery = '*[_type=="venue" && references($userId)]'
  const params = {userId}
  const result = await performQuery(dataStore, venueAccessQuery, params)
  console.log('Got result', result)
  return null
}

module.exports = async (userId, options = {}) => {
  await lookup(userId, options.dataStore)
  const accessFilters = Object.assign({}, options.defaultFilters)
  return accessFilters
}
