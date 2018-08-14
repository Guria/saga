const express = require('express')
const serveFile = require('./serveFile')
const serveImage = require('./serveImage')

const data = express.Router()

data.use('/files', serveFile)
data.use('/images', serveImage)

module.exports = data
