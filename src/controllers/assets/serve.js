const express = require('express')
const serveFile = require('./serveFile')
const serveImage = require('./serveImage')

const data = express.Router()

data.get('/images/vega/:dataset/:assetId', serveImage)
data.get('/files/vega/:dataset/:assetId', serveFile)

module.exports = data
