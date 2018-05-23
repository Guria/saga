const MongoClient = require('mongodb').MongoClient
const Transaction = require('./Transaction')
const filterToQuerySelector = require('./filterToQuerySelector')

class Store {
  constructor(config, options) {
    const {dataset} = options
    this.url = config.url
    this.databaseName = dataset
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

  newTransaction(options = {}) {
    return new Transaction(this, options)
  }

  getDocumentsById(ids) {
    return this.collection.find({_id: {$in: ids}}).toArray()
  }

  async getDocumentById(id) {
    const docs = await this.getDocumentsById([id])
    return docs ? docs[0] : null
  }

  fetcher() {
    return filter => {
      // TODO: Compile filter expression to constraints for find
      const querySelector = filterToQuerySelector(filter)
      return this.collection.find(querySelector).toArray()
    }
  }
}

module.exports = Store
