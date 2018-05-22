const path = require('path')
const express = require('express')
const config = require('../../config')
const basePath = path.join(config.assets.options.basePath, 'files')

module.exports = express.static(basePath, {fallthrough: false, index: false})
