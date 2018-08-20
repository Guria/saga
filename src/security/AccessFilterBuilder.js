/* eslint-disable complexity */

import {uniqBy} from 'lodash'
const UserCapabilityDiviner = require('./UserCapabilityDiviner')
const requiredCapabilities = require('./requiredCapabilities.js')
const actions = ['read', 'create', 'update', 'delete']
const documentTypes = [
  'venue',
  'issue',
  'track',
  'stage',
  'user',
  'article',
  'comment',
  'reviewProcess',
  'reviewItem',
  'featureConfig',
  'featureState'
]

function quote(item) {
  return `"${item}"`
}

function quoteItems(items) {
  return `[${items.map(quote).join(',')}]`
}

function querifyTuples(tuples) {
  const queryfied = tuples
    .map(tuple => {
      if (tuples.length === 1) {
        // no sense in returning a single true, it just adds noise
        return tuple[0] === true ? null : `(${tuple[0]})`
      }
      return tuple.length === 1 ? `(${tuple[0]})` : `(${tuple[0]} in ${quoteItems(tuple[1])})`
    })
    .filter(Boolean)
  if (queryfied.length > 1) {
    return queryfied.join(' || ')
  }
  return queryfied.length < 1 ? null : queryfied
}

// This class defines which capabilities a given user must have in order
// to gain access to a document type.
// The filters produced here are applied in SecurityManager
class AccessFilterBuilder {
  constructor(userId, dataStore, venueId) {
    this.userId = userId
    this.venueId = venueId
    this.dataStore = dataStore
  }

  async fetchAllCapabilities() {
    if (!this.userCapabilities) {
      const userCapabilities = new UserCapabilityDiviner(this.userId, this.dataStore, this.venueId)
      this.userCapabilities = await userCapabilities.runAll()
    }
    return this.userCapabilities
  }

  // Cosmetic
  // [[false], [false]] --> [[false]]
  deepUniq(array) {
    return uniqBy(array, JSON.stringify)
  }

  assembleCapabilitiesByActionAndType() {
    const allCapabilityTuples = {}
    actions.forEach(action => {
      allCapabilityTuples[action] = {}
      documentTypes.forEach(type => {
        const requirements = requiredCapabilities[action][type]
        allCapabilityTuples[action][type] = this.deepUniq(
          requirements.map(requirement => this.userCapabilities[requirement])
        )
      })
    })
    return allCapabilityTuples
  }

  async determineFilters() {
    await this.fetchAllCapabilities()
    const capabilitiesByActionAndType = this.assembleCapabilitiesByActionAndType()
    //console.log('capabilitiesByActionAndType', JSON.stringify(capabilitiesByActionAndType, null, 2))
    const result = {}
    actions.forEach(action => {
      const queries = documentTypes.map(type => {
        const specificCapabilities = capabilitiesByActionAndType[action][type]
        const query = [`_type == "${type}"`, querifyTuples(specificCapabilities)]
          .filter(Boolean)
          .join(' && ')
        return `(${query})`
      })
      result[action] = `(${queries.join(' || ')})`
    })
    result.capabilities = capabilitiesByActionAndType
    return result
  }
}

module.exports = AccessFilterBuilder
