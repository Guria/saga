const close = require('./close')
const getAuthHeader = require('./getAuthHeader')
const getConfig = require('./getConfig')
const getApp = require('./getApp')
const getCallbackServer = require('./getCallbackServer')
const createAdminUser = require('./createAdminUser')
const getSessionCookie = require('./getSessionCookie')

const delay = (ms = 250) =>
  new Promise(resolve => (ms ? setTimeout(resolve, ms) : setImmediate(resolve)))

module.exports = {
  close,
  delay,
  getApp,
  getConfig,
  getAuthHeader,
  getCallbackServer,
  createAdminUser,
  getSessionCookie
}
