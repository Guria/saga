const {Patcher} = require('@sanity/mutator')
const filterToQuerySelector = require('./filterToQuerySelector')
const MutationError = require('../../errors/MutationError')

// eslint-disable-next-line id-length
const writeOptions = {writeConcern: {w: 'majority', j: true}}
const withSession = ({transaction}) => Object.assign({session: transaction.session}, writeOptions)

module.exports = class MongoDbAdapter {
  constructor(client, config, options) {
    this.databaseName = options.dataset
    this.client = client
    this.db = this.client.db(this.databaseName)
    this.collection = this.db.collection(config.options.collection || 'documents')
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
    const session = this.client.startSession()
    // @todo implement actual transaction commit
    const commit = () => session.endSession()
    // @todo implement actual transaction abort
    const abort = () => session.endSession()
    return {session, commit, abort}
  }

  create(doc, options) {
    return this.collection
      .insertOne(doc, withSession(options))
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
      .insertOne(doc, withSession(options))
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
    return this.collection.save(doc, withSession(options)).then(res => ({
      id: doc._id,
      operation: res.result.nModified > 0 ? 'update' : 'create'
    }))
  }

  delete(selector, options) {
    if (!selector.id) {
      throw new Error('Can only delete by ID')
    }

    return this.collection
      .deleteOne({_id: selector.id}, withSession(options))
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
      .save(next, withSession(options))
      .then(() => ({id: patches.id, operation: 'update'}))
  }

  truncate() {
    return this.collection.drop()
  }
}

function isDuplicateKeyError(err) {
  return err.code === 11000
}
