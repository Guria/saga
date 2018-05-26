const lyra = require('../../src/app')
const getConfig = require('./getConfig')

module.exports = (config = {}) => lyra(getConfig(config))
