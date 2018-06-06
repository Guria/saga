const EventEmitter = require('events')
const PQueue = require('p-queue')
const {find, isEqual} = require('lodash')
const {Patcher} = require('@sanity/mutator')
const Transaction = require('./Transaction')
const TransactionError = require('./errors/TransactionError')
const MutationError = require('./errors/MutationError')
const mapMutations = require('./mutationModifiers/mapMutations')
const findReferences = require('../util/findReferences')

class Store extends EventEmitter {
  constructor(adapter) {
    super()
    this.adapter = adapter
    this.mutationQueue = new PQueue({concurrency: 1})
    this.isClosing = false
    this.fetch = this.fetch.bind(this)
  }

  async close() {
    this.isClosing = true
    await this.mutationQueue.onIdle()
    return this
  }

  newTransaction(options = {}) {
    return new Transaction(this, options)
  }

  getDocumentsById(ids) {
    return this.adapter.getDocumentsById(ids)
  }

  async getDocumentById(id) {
    const docs = await this.getDocumentsById([id])
    return docs ? docs[0] : null
  }

  fetch(query, params = {}) {
    // @todo remove try/catch/fallback logic once groq works
    try {
      return this.adapter.fetch(query, params)
    } catch (err) {
      try {
        return this.adapter.__fetch(query, params)
      } catch (fallbackErr) {
        // noop
      }

      throw err
    }
  }

  /* eslint-disable no-await-in-loop, max-depth, id-length */
  executeTransaction(trx, options) {
    if (this.isClosing) {
      throw new Error('Transaction cannot be performed; store is closing')
    }

    const muts = trx.getMutations()
    const transactionId = trx.getTransactionId()
    const identity = trx.getIdentity()
    const timestamp = new Date()
    const ids = getTouchedDocumentIds(muts)
    const mutations = mapMutations(muts, {timestamp, transaction: trx})

    // eslint-disable-next-line complexity
    return this.mutationQueue.add(async () => {
      const documents = await this.adapter.getDocumentsById(ids)
      const transaction = await this.adapter.startTransaction()
      const patchDocs = mergeCreatedDocuments(mutations, documents)

      let results = []
      try {
        for (let m = 0; m < mutations.length; m++) {
          const {operation, body} = mutations[m]
          if (!this.adapter[operation]) {
            throw new Error(`Operation "${operation}" not implemented`)
          }

          // Apply patches with mutator to avoid having to the same work in each adapter
          const isDelete = operation === 'delete'
          const isPatch = operation === 'patch'
          const targetDoc = isPatch && patchDocs.find(doc => doc._id === body.id)
          let next
          if (isPatch && targetDoc) {
            const patch = new Patcher(body)
            next = patch.apply(targetDoc)
          }

          if (isPatch || operation.startsWith('create')) {
            await this.checkForeignKeysCreation(next || body, patchDocs, m)
          }

          const deleteDoc = isDelete && documents.find(doc => doc._id === body.id)
          if (deleteDoc) {
            await this.checkForeignKeysDeletion(deleteDoc, null, m)
          }

          try {
            results.push(await this.adapter[operation](body, {transaction, next}))
          } catch (err) {
            if (err instanceof MutationError) {
              throw new TransactionError({errors: [{error: err.payload, index: m}]})
            }

            throw err
          }
        }

        results = results.filter(Boolean)

        const refPatches = generateDocumentReferencePatches(results, documents)
        for (let i = 0; i < refPatches.length; i++) {
          const patch = refPatches[i]
          await this.adapter.setReferences(patch.id, patch.references, {transaction})
        }

        await transaction.commit()

        this.emitMutationEvents({
          mutations: muts,
          transactionId,
          timestamp,
          identity,
          results,
          documents
        })
      } catch (err) {
        await transaction.abort()
        throw err
      }

      return results
    })
  }
  /* eslint-enable no-await-in-loop, max-depth, id-length */

  async checkForeignKeysDeletion(targetDoc, patchDocs, i) {
    const referencingIDs = await this.adapter.findReferencingDocuments(targetDoc._id, {
      includeWeak: false
    })

    if (referencingIDs.length === 0) {
      return
    }

    const description = `Document "${
      targetDoc._id
    }" cannot be deleted as there are references to it from "${referencingIDs[0]}"`

    throw new TransactionError({
      errors: [
        {
          error: {
            description,
            id: targetDoc._id,
            referencingIDs,
            type: 'documentHasExistingReferencesError'
          },
          index: i
        }
      ],
      statusCode: 409
    })
  }

  async checkForeignKeysCreation(next, patchDocs, i) {
    // See if the document references any items strongly, and validate that the documents exist
    const strongRefs = findReferences(next)
      .filter(ref => !ref.weak)
      .map(ref => ref.id)

    const existingIds = strongRefs && (await this.adapter.documentsExists(strongRefs))
    const allExistingIds = (existingIds || []).concat(patchDocs.map(doc => doc._id))
    const missing = strongRefs && strongRefs.find(id => !allExistingIds.includes(id))
    if (!missing) {
      return
    }

    const description = `Document "${next._id}" references non-existent document "${missing}"`
    throw new TransactionError({
      errors: [
        {
          error: {
            description,
            id: next._id,
            referenceID: missing,
            type: 'documentReferenceDoesNotExistError'
          },
          index: i
        }
      ],
      statusCode: 409
    })
  }

  emitMutationEvents(options) {
    const {mutations, transactionId, timestamp, identity, results, documents} = options
    const mutationResults = getUniqueDocumentResults(results)
    mutationResults.forEach(result => {
      const documentId = result.id
      const previous = documents.find(doc => doc._id === documentId)

      // @todo Hmmz? How do we determine? Query/filter is also a part of this equation
      let transition = 'update'
      if (!previous || !result) {
        transition = !previous && result ? 'appear' : 'disappear'
      }

      this.emit('mutation', {
        type: 'mutation',
        eventId: `${transactionId}#${documentId}`,
        documentId,
        transactionId,
        identity,
        resultRev: transactionId,
        timestamp: timestamp.toISOString(),
        previousRev: previous ? previous._rev : undefined,
        previous,
        mutations,
        result: result.document,
        transition
      })
    })
  }

  truncate() {
    // eslint-disable-next-line no-process-env
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('Refusing to truncate when NODE_ENV is not "test"')
    }

    return this.adapter.truncate()
  }
}

function getUniqueDocumentResults(allResults) {
  const seenIds = new Set()
  const results = []

  for (let i = allResults.length - 1; i >= 0; i--) {
    const result = allResults[i]
    if (seenIds.has(result.id)) {
      continue
    }

    seenIds.add(result.id)
    results.unshift(result)
  }

  return results
}

function getTouchedDocumentIds(mutations) {
  return Array.from(
    mutations.reduce((set, mutation) => {
      const operation = Object.keys(mutation)[0]
      const body = mutation[operation]
      return set.add(idFromMutation(operation, body))
    }, new Set())
  )
}

function idFromMutation(operation, body) {
  switch (operation) {
    case 'create':
    case 'createOrReplace':
    case 'createIfNotExists':
      return body._id
    case 'delete':
    case 'patch':
      return body.id
    default:
      throw new Error(`Unknown mutation type "${operation}"`)
  }
}

function mergeCreatedDocuments(mutations, existing) {
  return (
    mutations
      // Remove non-create (or id-less) mutations
      .filter(mut => mut.operation.startsWith('create') && mut.body._id)
      // Remove create/createIfNotExists if document exists
      .filter(mut => isReplace(mut) || !existing.find(doc => doc._id === mut.body._id))
      // Remove creates that exist later in mutation array
      .filter((mut, i, muts) => !find(muts, item => item.body._id === mut.body._id, i + 1))
      // Merge remaining mutations, make sure to override existing documents with same ID
      .reduce((docs, mut) => {
        const prev = existing.findIndex(doc => doc._id === mut._id)
        return prev === -1 ? docs.concat(mut.body) : docs.splice(prev, 1, mut.body) && docs
      }, existing.slice())
  )
}

function isReplace(mut) {
  return mut.operation === 'createOrReplace'
}

function generateDocumentReferencePatches(results, prevDocs) {
  const mutationResults = getUniqueDocumentResults(results)

  const refs = mutationResults.map(result => {
    const prevDoc = prevDocs.find(doc => doc._id === result.id)
    const prevRefs = prevDoc && findReferences(prevDoc)
    const newRefs = findReferences(result.document)

    if (!prevDoc && newRefs.length === 0) {
      return false
    }

    const hasDiff =
      !prevDoc ||
      prevRefs.length !== newRefs.length ||
      prevRefs.some((prevRef, idx) => !isEqual(prevRef, newRefs[idx]))

    return (
      hasDiff && {
        id: result.id,
        references: newRefs
      }
    )
  })

  return refs.filter(Boolean)
}

module.exports = Store
