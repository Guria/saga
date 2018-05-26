const MongoClient = require('mongodb').MongoClient

module.exports = class MongoDbConnector {
  constructor(config) {
    this.config = config
  }

  get() {
    return this.connect()
  }

  async connect() {
    if (this.client) {
      return this.client
    }

    this.client = await MongoClient.connect(this.config.url, {useNewUrlParser: true})
    return this.client
  }

  disconnect() {
    return this.client ? this.client.close() : Promise.resolve()
  }
}
