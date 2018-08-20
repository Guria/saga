const {merge, uniqueId} = require('lodash')
const path = require('path')
const os = require('os')
const randomstring = require('randomstring').generate
const defaultConfig = require('../../src/config')

const executionId = randomstring()

const getTestConfig = () => {
  const testId = uniqueId(`saga-test-${executionId}-`)
  return {
    env: 'test',
    logLevel: 'warn',
    assets: {
      options: {
        basePath: path.join(os.tmpdir(), executionId)
      }
    }
  }
}

module.exports = (cfg = {}) => merge({}, defaultConfig, getTestConfig(), cfg)
