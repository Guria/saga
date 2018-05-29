const MongoClient = require('mongodb').MongoClient

module.exports = class MongoDbConnector {
  constructor(config) {
    this.config = config
    this.client = null
    this.connecting = null
  }

  get() {
    return this.connect()
  }

  connect() {
    if (this.client) {
      return this.client
    }

    if (this.connecting) {
      return this.connecting
    }

    this.connecting = MongoClient.connect(this.config.url, {useNewUrlParser: true}).then(client => {
      this.client = client
      this.connecting = null
      return client
    })

    return this.connecting
  }

  disconnect() {
    if (!this.client && !this.connecting) {
      return Promise.resolve()
    }

    return this.connecting
      ? // Not yet connected, since we can't cancel, wait for it to complete first
        this.connecting.then(() => this.client.close())
      : // If already connected
        this.client.close()
  }
}
