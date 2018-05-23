const Store = require('../../src/datastore/Store')

module.exports = () => {
  return Store.closeAll()
}
