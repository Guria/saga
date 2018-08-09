const express = require('express')
const serveFile = require('./serveFile')
const serveImage = require('./serveImage')

const data = express.Router()

data.use('/images', serveImage)
data.use('/files', serveFile)

module.exports = data
