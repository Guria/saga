import {ensureConnected} from './utils'

const StoreManager = require('../src/datastore/StoreManager')
const {fullAccessFilterExpressions} = require('../src/security/defaultFilters')
const config = require('../src/config')
const url = require('url')
const UserStore = require('../src/userstore')

const SERVER_URL = url.format({
  protocol: 'http',
  hostname: config.hostname,
  port: config.port
})

export const ROOT_CLAIM_URL = url.format({
  protocol: 'http',
  hostname: config.hostname,
  port: config.port,
  pathname: `/v1/invitations/root/login`
})

export const ROOT_INVITE_URL = url.format({
  protocol: 'http',
  hostname: config.hostname,
  port: config.port,
  pathname: `/v1/invitations/root`
})

const fullAccessDatastore = new StoreManager(config.datastore)
fullAccessDatastore.setSecurityManager({
  getFilterExpressionsForUser: () => Promise.resolve(fullAccessFilterExpressions)
})

const userStore = new UserStore({
  dataStore: fullAccessDatastore,
  db: config.datastore.options.systemDb
})

export function withFullAccessDataStore(task) {
  return task(fullAccessDatastore).finally(() => fullAccessDatastore.disconnect())
}
export function withUserStore(task) {
  return task(userStore).finally(() => fullAccessDatastore.disconnect())
}

export function connect() {
  return ensureConnected(SERVER_URL)
}
