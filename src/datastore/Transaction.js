// Represents one set of crud operations on the database. Isolated like this
// to be able to approach transaction-like semantics.

module.exports = class Transaction {
  constructor(collection) {
    // @todo create proper id
    const id = `${Math.random()}`.slice(2)
    this.id = `moop-${id}`
    this.documents = collection
  }

  // Must be called when the set of operations is completed. If the backing store
  // has transactional support, this should commit the changes.
  // TODO: Asynchronously return transaction report including all modified documents + the ids of
  // all touched documents.
  close() {
    return Promise.resolve({
      transactionId: this.id,
      results: [{id: 'foo', operation: 'update'}]
    })
  }

  create(attributes) {
    return this.documents.insertOne(attributes)
  }

  delete(_id) {
    return this.documents.deleteOne({_id})
  }

  async update(_id, operation) {
    console.log('Finding by id', _id)
    const original = await this.documents.findOne({_id})
    console.log('Found', original)
    const next = operation(original)
    await this.documents.save(next)
  }

  createOrReplace(attributes) {
    return this.documents.save(attributes)
  }
}
