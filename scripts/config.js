import {ensureConnected} from './utils'

const StoreManager = require('../src/datastore/StoreManager')
const {fullAccessFilterExpressions} = require('../src/security/defaultFilters')
const config = require('../src/config')
const url = require('url')

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

export function withFullAccessDataStore(task) {
  return task(fullAccessDatastore).finally(() => fullAccessDatastore.disconnect())
}

export function connect() {
  return ensureConnected(SERVER_URL)
}
