function lookup() {
  return null
}

module.exports = async (identityId, venueId, options = {}) => {
  await lookup()
  const accessFilters = Object.assign({}, options.default)
  return accessFilters
}
