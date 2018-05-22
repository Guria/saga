const express = require('express')
const uploadFile = require('./uploadFile')
const uploadImage = require('./uploadImage')

const data = express.Router()

data.post('/images/:dataset', uploadImage)
data.post('/files/:dataset', uploadFile)

module.exports = data
