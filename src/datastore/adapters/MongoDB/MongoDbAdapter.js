const {noop} = require('lodash')
const {Patcher} = require('@sanity/mutator')
const filterToQuerySelector = require('./filterToQuerySelector')
const MutationError = require('../../errors/MutationError')

// eslint-disable-next-line id-length
const writeOptions = {w: 'majority', j: true}
const supportsSession = false
const withSession = ({transaction}, options = {}) =>
  supportsSession
    ? {session: transaction.session, ...writeOptions, ...options}
    : {...writeOptions, ...options}

module.exports = class MongoDbAdapter {
  constructor(client, config, options) {
    this.databaseName = `${config.options.dbPrefix || ''}${options.dataset}`
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
    if (!supportsSession) {
      return {commit: noop, abort: noop}
    }

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
        document: doc,
        operation: 'create'
      }))
      .catch(err => {
        if (!isDuplicateKeyError(err)) {
          throw err
        }

        throw new MutationError({
          description: `Document by ID "${doc._id}" already exists`,
          id: doc && doc._id,
          type: 'documentAlreadyExistsError'
        })
      })
  }

  createIfNotExists(doc, options) {
    return this.collection
      .insertOne(doc, withSession(options))
      .then(() => ({
        id: doc._id,
        document: doc,
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
    return this.collection
      .findOneAndReplace({_id: doc._id}, doc, withSession(options, {upsert: true}))
      .then(res => ({
        id: doc._id,
        document: doc,
        operation: res.lastErrorObject && res.lastErrorObject.updatedExisting ? 'update' : 'create'
      }))
  }

  delete(selector, options) {
    if (!selector.id) {
      throw new Error('Can only delete by ID')
    }

    return this.collection
      .findOneAndDelete({_id: selector.id}, withSession(options))
      .then(res => (res.value ? {id: selector.id, operation: 'delete'} : null))
  }

  async patch(patches, options) {
    const doc = await this.collection.findOne({_id: patches.id})
    if (!doc) {
      throw new MutationError({
        description: `The document with the ID "${patches.id}" was not found`,
        id: patches.id,
        type: 'documentNotFoundError'
      })
    }

    const patch = new Patcher(patches)
    const next = patch.apply(doc)
    return this.collection
      .findOneAndReplace({_id: next._id}, next, withSession(options, {upsert: true}))
      .then(res => ({
        id: next._id,
        document: next,
        operation: 'update'
      }))
  }

  truncate() {
    return this.collection.drop().catch(noop)
  }

  // @todo remove when groq works
  // this is a fallback because groq doesnt work but we want to develop as if it did
  __fetch(query, params = {}) {
    if (
      query === '*[_type == "identity" && provider == $provider && providerId == $providerId][0]'
    ) {
      return this.collection.findOne({_type: 'identity', ...params})
    }

    if (query === '*[_type == "vega.user" && identityId == $identityId][0]') {
      return this.collection.findOne({_type: 'vega.user', ...params})
    }

    throw new Error('Unknown query, nothing to fall back on')
  }
}

function isDuplicateKeyError(err) {
  return err.code === 11000
}
