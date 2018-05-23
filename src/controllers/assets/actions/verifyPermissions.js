const generateId = require('randomstring').generate

module.exports = async (store, asset) => {
  const _id = `perm-check-${generateId({length: 16})}`
  const permAsset = Object.assign({_id}, asset)
  const trx = store.newTransaction()
  await trx.create(permAsset)
  await trx.delete(_id)
  return trx.close()
}
