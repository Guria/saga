const uuid = require('uuid/v4')

// Represents one set of crud operations on the database. Isolated like this
// to be able to approach transaction-like semantics.
module.exports = class Transaction {
  constructor(store, options = {}) {
    const {transactionId} = options
    this.id = typeof transactionId === 'string' ? transactionId : uuid()
    this.store = store
    this.time = new Date()
    // List of performed operations
    this.operations = []
    // Cache of the current state of the documents touched during this txn
    this.cache = {}
  }

  // Must be called when the set of operations is completed. If the backing store
  // has transactional support, this should commit the changes.
  // TODO: Asynchronously return transaction report including all modified documents + the ids of
  // all touched documents.
  close() {
    return Promise.resolve({
      transactionId: this.id,
      results: this.operations
    })
  }

  async create(attributes) {
    this.operations.push({
      id: attributes._id,
      operation: 'create'
    })
    this.cache[attributes._id] = attributes

    await this.store.connect()
    return this.store.collection.insertOne(attributes)
  }

  async delete(_id) {
    this.operations.push({
      id: _id,
      operation: 'delete'
    })
    delete this.cache[_id]

    await this.store.connect()
    return this.store.collection.deleteOne({_id})
  }

  async update(_id, operation) {
    this.operations.push({
      id: _id,
      operation: 'update'
    })

    const original = this.cache[_id] || (await this.documents.findOne({_id}))
    const next = operation(original)
    this.cache[_id] = next

    await this.store.connect()
    return this.store.collection.save(next)
  }

  async createOrReplace(attributes) {
    this.operations.push({
      id: attributes._id,
      operation: 'create'
    })

    await this.store.connect()
    return this.store.collection.save(attributes)
  }
}
