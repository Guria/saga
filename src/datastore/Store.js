const PQueue = require('p-queue')
const MongoDb = require('./adapters/MongoDB/MongoDB')
const Transaction = require('./Transaction')
const timeStampMutations = require('./timeStampMutations')
const TransactionError = require('./errors/TransactionError')
const MutationError = require('./errors/MutationError')

class Store {
  constructor(config, options) {
    this.adapter = new MongoDb(config, options)
    this.mutationQueue = new PQueue({concurrency: 1})
  }

  async connect() {
    await this.adapter.connect()
    return this
  }

  async disconnect() {
    await this.adapter.disconnect()
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
    const mutations = timeStampMutations(muts, new Date())
    return this.mutationQueue.add(async () => {
      const transaction = await this.adapter.startTransaction()

      const results = []
      try {
        for (let m = 0; m < mutations.length; m++) {
          const mutation = mutations[m]
          const operations = Object.keys(mutation)
          for (let o = 0; o < operations.length; o++) {
            const operation = operations[o]
            const body = mutation[operation]
            try {
              results.push(await this.adapter[operation](body, {transaction}))
            } catch (err) {
              if (err instanceof MutationError) {
                throw new TransactionError({errors: [{error: err.payload, index: m}]})
              }

              throw err
            }
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
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('Refusing to truncate when NODE_ENV is not "test"')
    }

    return this.adapter.truncate()
  }
}

module.exports = Store
