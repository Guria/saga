const express = require('express')
const currentUserGrants = require('./currentUserGrants')

const grants = express.Router()

grants.get('/:dataset', currentUserGrants)

module.exports = grants
