const {merge} = require('lodash')
const path = require('path')
const os = require('os')
const randomstring = require('randomstring').generate
const defaultConfig = require('../../src/config')

const testConfig = {
  env: 'test',
  assets: {
    options: {
      basePath: path.join(os.tmpdir(), 'lyra-test', randomstring())
    }
  }
}

module.exports = (cfg = {}) => merge({}, defaultConfig, testConfig, cfg)
