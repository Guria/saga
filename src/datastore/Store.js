const PQueue = require('p-queue')
const Transaction = require('./Transaction')
const TransactionError = require('./errors/TransactionError')
const MutationError = require('./errors/MutationError')
const mapMutations = require('./mutationModifiers/mapMutations')

class Store {
  constructor(adapter) {
    this.adapter = adapter
    this.mutationQueue = new PQueue({concurrency: 1})
    this.isClosing = false
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

  fetch(filter) {
    return this.adapter.fetch(filter)
  }

  async getDocumentById(id) {
    const docs = await this.getDocumentsById([id])
    return docs ? docs[0] : null
  }

  /* eslint-disable no-await-in-loop, max-depth, id-length */
  executeTransaction(muts, options) {
    if (this.isClosing) {
      throw new Error('Transaction cannot be performed; store is closing')
    }

    const timestamp = new Date()
    const mutations = mapMutations(muts, {timestamp})

    return this.mutationQueue.add(async () => {
      const transaction = await this.adapter.startTransaction()

      const results = []
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
        await this.adapter.commitTransaction(transaction)
      } catch (err) {
        this.adapter.abortTransaction()
        throw err
      }

      return results.filter(Boolean)
    })
  }
  /* eslint-enable no-await-in-loop, max-depth, id-length */

  truncate() {
    // eslint-disable-next-line no-process-env
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('Refusing to truncate when NODE_ENV is not "test"')
    }

    return this.adapter.truncate()
  }
}

module.exports = Store
