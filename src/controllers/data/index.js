const express = require('express')
const listen = require('./listen')
const getDocs = require('./get')
const queryDocs = require('./query')
const mutateDocs = require('./mutate')

const data = express.Router()

// Query
data.get('/query/:datasetName', queryDocs.get)
data.post('/query:datasetName', queryDocs.post)

// Mutate
data.post('/mutate/:datasetName', mutateDocs)

// Listen
data.get('/listen/:datasetName', listen)

// Get documents by ID
data.get('/doc/:datasetName/:documentId', getDocs)

module.exports = data
