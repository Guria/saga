const {Patcher} = require('@sanity/mutator')
const MongoClient = require('mongodb').MongoClient
const filterToQuerySelector = require('./filterToQuerySelector')
const MutationError = require('../../errors/MutationError')

const writeOptions = {writeConcern: {w: 'majority', j: true}}

module.exports = class MongoDbAdapter {
  constructor(config, options) {
    this.config = config
    this.url = config.url
    this.databaseName = options.dataset
    this.collection = null
    this.client = null
    this.db = null
  }

  async connect() {
    // Already connected?
    if (this.client) {
      return this
    }

    this.client = await MongoClient.connect(this.url, {useNewUrlParser: true})
    this.db = this.client.db(this.databaseName)
    this.collection = this.db.collection('documents')

    return this
  }

  disconnect() {
    if (!this.client) {
      return Promise.resolve()
    }

    const close = this.client.close()
    this.collection = null
    this.client = null
    this.db = null

    return close
  }

  getDocumentsById(ids) {
    return this.collection.find({_id: {$in: ids}}).toArray()
  }

  fetch(filter) {
    // TODO: Compile filter expression to constraints for find
    const querySelector = filterToQuerySelector(filter)
    return this.collection.find(querySelector).toArray()
  }

  startTransaction() {
    // @todo implement
  }

  commitTransaction() {
    // @todo implement
  }

  abortTransaction() {
    // @todo implement
  }

  create(doc, options) {
    return this.collection
      .insertOne(doc, writeOptions)
      .then(() => ({
        id: doc._id,
        operation: 'create'
      }))
      .catch(err => {
        if (!isDuplicateKeyError(err)) {
          throw err
        }

        throw new MutationError({
          description: `Document by ID "${doc._id}" already exists`,
          id: doc._id,
          type: 'documentAlreadyExistsError'
        })
      })
  }

  createIfNotExists(doc, options) {
    return this.collection
      .insertOne(doc, writeOptions)
      .then(() => ({
        id: doc._id,
        operation: 'create'
      }))
      .catch(err => {
        if (isDuplicateKeyError(err)) {
          return null
        }

        throw err
      })
  }

  createOrReplace(doc, options) {
    return this.collection.save(doc, writeOptions).then(res => ({
      id: doc._id,
      operation: res.result.nModified > 0 ? 'update' : 'create'
    }))
  }

  delete(selector, options) {
    if (!selector.id) {
      throw new Error('Can only delete by ID')
    }

    return this.collection
      .deleteOne({_id: selector.id}, writeOptions)
      .then(res => (res.deletedCount > 0 ? {id: selector.id, operation: 'delete'} : null))
  }

  async patch(patches, options) {
    const doc = await this.collection.findOne({_id: patches.id})
    if (!doc) {
      throw new MutationError({
        description: `The document with the ID "${patches.id}" was not found`,
        id: doc._id,
        type: 'documentNotFoundError'
      })
    }

    const patch = new Patcher(patches)
    const next = patch.apply(doc)
    return this.collection
      .save(next, writeOptions)
      .then(() => ({id: patches.id, operation: 'update'}))
  }

  truncate() {
    return this.collection.deleteMany({}, writeOptions)
  }
}

function isDuplicateKeyError(err) {
  return err.code === 11000
}
