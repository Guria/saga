const MongoClient = require('mongodb').MongoClient
const config = require('../config')
const Transaction = require('./Transaction')
const filterToQuerySelector = require('./filterToQuerySelector')

const stores = new Map()

class Store {
  constructor(options) {
    const {dataset} = options
    this.url = config.datastore.url
    this.databaseName = dataset
    this.collection = null
    this.client = null
    this.db = null
  }

  async connect() {
    this.client = await MongoClient.connect(this.url, {useNewUrlParser: true})

    this.db = this.client.db(this.databaseName)
    this.collection = this.db.collection('documents')

    return this
  }

  disconnect() {
    this.client.close()
    this.collection = null
    this.client = null
    this.db = null
  }

  newTransaction() {
    return new Transaction(this.collection)
  }

  fetcher() {
    return filter => {
      // TODO: Compile filter expression to constraints for find
      const querySelector = filterToQuerySelector(filter)
      console.log('querySelector:', querySelector)
      return this.collection.find(querySelector).toArray()
    }
  }
}

Store.forDataset = async dataset => {
  if (stores.has(dataset)) {
    return stores.get(dataset)
  }

  const store = new Store({dataset})
  await store.connect()
  stores.set(dataset, store)
  return store
}

module.exports = Store
