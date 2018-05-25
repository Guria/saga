const generateId = require('randomstring').generate

module.exports = (store, asset) => {
  const _id = `perm-check-${generateId({length: 16})}`
  const permAsset = Object.assign({}, asset, {_id})
  return store
    .newTransaction()
    .create(permAsset)
    .delete(_id)
    .commit()
}
