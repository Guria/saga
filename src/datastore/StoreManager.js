const Store = require('./Store')

module.exports = class StoreManager {
  constructor(config) {
    this.config = config
    this.stores = new Map()
  }

  forDataset(dataset) {
    if (this.stores.has(dataset)) {
      return this.stores.get(dataset).connect()
    }

    const store = new Store(this.config, {dataset})
    this.stores.set(dataset, store)
    return store.connect()
  }

  closeAll() {
    const stores = Array.from(this.stores.values())
    const ops = stores.map(store => store.disconnect())
    return Promise.all(ops)
  }
}
