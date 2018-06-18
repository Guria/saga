const {EventEmitter} = require('events')
const Store = require('./Store')
const adapters = require('./adapters')

module.exports = class StoreManager extends EventEmitter {
  constructor(config) {
    super()

    const storeImplementation = adapters[config.adapter]
    if (!storeImplementation) {
      throw new Error(`Could not find DataStore adapter for type "${config.adapter}"`)
    }

    this.config = config
    this.storeImplementation = storeImplementation
    this.connector = new storeImplementation.Connector(config)
    this.stores = new Map()
    this.onMutation = this.onMutation.bind(this)
  }

  connect() {
    return this.connector.connect()
  }

  async forDataset(dataset) {
    const client = await this.connector.connect()
    if (this.stores.has(dataset)) {
      return this.stores.get(dataset)
    }

    const Adapter = this.storeImplementation.Adapter
    const adapter = new Adapter(client, this.config, {dataset})
    const store = new Store(adapter, {dataset})
    this.stores.set(dataset, store)
    store.on('mutation', this.onMutation)
    return store
  }

  closeAll() {
    const stores = Array.from(this.stores.entries())
    const ops = stores.map(([dataset, store]) => this.stores.delete(dataset) && store.close())
    return Promise.all(ops)
  }

  onMutation(mut) {
    this.emit('mutation', mut)
  }

  disconnect() {
    return this.connector.disconnect()
  }
}
