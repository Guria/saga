const uuid = require('uuid/v4')
const Patch = require('./Patch')
const validators = require('./validators')

module.exports = class Transaction {
  constructor(store, options = {}) {
    const {transactionId, mutations} = options
    this.trxId = transactionId || uuid()
    this.mutations = mutations || []
    this.store = store
  }

  create(doc) {
    validators.validateObject('create', doc)
    return this._add({create: doc})
  }

  createIfNotExists(doc) {
    const op = 'createIfNotExists'
    validators.validateObject(op, doc)
    validators.requireDocumentId(op, doc)
    return this._add({[op]: doc})
  }

  createOrReplace(doc) {
    const op = 'createOrReplace'
    validators.validateObject(op, doc)
    validators.requireDocumentId(op, doc)
    return this._add({[op]: doc})
  }

  delete(documentId) {
    validators.validateDocumentId('delete', documentId)
    return this._add({delete: {id: documentId}})
  }

  patch(documentId, patchOps) {
    const isBuilder = typeof patchOps === 'function'

    if (isBuilder) {
      const patch = patchOps(new Patch(documentId, {}, this.client))
      if (!(patch instanceof Patch)) {
        throw new Error('function passed to `patch()` must return the patch')
      }

      return this._add({patch: patch.serialize()})
    }

    return this._add({patch: {id: documentId, ...patchOps}})
  }

  transactionId(id) {
    if (!id) {
      return this.trxId
    }

    this.trxId = id
    return this
  }

  serialize() {
    return this.mutations.slice()
  }

  toJSON() {
    return this.serialize()
  }

  async commit(options = {}) {
    const results = await this.store.executeTransaction(this.serialize(), options)
    return {
      transactionId: this.trxId,
      results
    }
  }

  reset() {
    this.mutations = []
    return this
  }

  _add(mut) {
    this.mutations.push(mut)
    return this
  }
}
