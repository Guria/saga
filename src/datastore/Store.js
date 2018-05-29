const EventEmitter = require('events')
const PQueue = require('p-queue')
const Transaction = require('./Transaction')
const TransactionError = require('./errors/TransactionError')
const MutationError = require('./errors/MutationError')
const mapMutations = require('./mutationModifiers/mapMutations')
const groqQuery = require('../groq/query')

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

  async fetch(filter, params = {}) {
    // @todo remove try/catch/fallback logic once groq works
    try {
      const result = await (typeof filter === 'string'
        ? groqQuery(filter, params, this.fetch)
        : this.adapter.fetch(filter, params))
      return result
    } catch (err) {
      try {
        return this.adapter.__fetch(filter, params)
      } catch (fallbackErr) {
        // noop
      }

      throw err
    }
  }

  async getDocumentById(id) {
    const docs = await this.getDocumentsById([id])
    return docs ? docs[0] : null
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

    return this.mutationQueue.add(async () => {
      const documents = await this.adapter.getDocumentsById(ids)
      const transaction = await this.adapter.startTransaction()

      let results = []
      try {
        for (let m = 0; m < mutations.length; m++) {
          const {operation, body} = mutations[m]
          if (!this.adapter[operation]) {
            throw new Error(`Operation "${operation}" not implemented`)
          }

          try {
            results.push(await this.adapter[operation](body, {transaction}))
          } catch (err) {
            if (err instanceof MutationError) {
              throw new TransactionError({errors: [{error: err.payload, index: m}]})
            }

            throw err
          }
        }

        await transaction.commit()
        results = results.filter(Boolean)

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

module.exports = Store
