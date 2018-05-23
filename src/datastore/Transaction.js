const uuid = require('uuid/v4')

// Represents one set of crud operations on the database. Isolated like this
// to be able to approach transaction-like semantics.
module.exports = class Transaction {
  constructor(collection) {
    this.id = uuid()
    this.documents = collection
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

  create(attributes) {
    this.operations.push({
      id: attributes._id,
      operation: 'create'
    })
    this.cache[attributes._id] = attributes
    return this.documents.insertOne(attributes)
  }

  delete(_id) {
    this.operations.push({
      id: _id,
      operation: 'delete'
    })
    delete this.cache[_id]
    return this.documents.deleteOne({
      _id
    })
  }

  async update(_id, operation) {
    this.operations.push({
      id: _id,
      operation: 'update'
    })
    console.log('Finding by id', _id)
    const original =
      this.cache[_id] ||
      (await this.documents.findOne({
        _id
      }))
    console.log('Found', original)
    const next = operation(original)
    this.cache[_id] = next
    await this.documents.save(next)
  }

  createOrReplace(attributes) {
    this.operations.push({
      id: attributes._id,
      operation: 'create'
    })
    return this.documents.save(attributes)
  }
}
