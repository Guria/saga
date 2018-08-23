/* eslint-disable complexity */

const UserCapabilityDiviner = require('./UserCapabilityDiviner')
const requiredCapabilities = require('./requiredCapabilities')
const {actions, documentTypes} = require('./securityConstants')

function quote(item) {
  return `"${item}"`
}

function arrayAsQuotedString(items) {
  return `[${items.map(quote).join(',')}]`
}

function querifyTuples(tuples) {
  const queryfied = tuples
    .map(tuple => `(${tuple[0]} in ${arrayAsQuotedString(tuple[1])})`)
    .join(' || ')

  return queryfied
}

// This class defines which capabilities a given user must have in order
// to gain access to a document type.
// The filters produced here are applied in SecurityManager
class PermissionsBuilder {
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

  compressCapabilities(action, type) {
    // Needed requirements for this action and type
    const requirements = requiredCapabilities[action][type]
    // The users' capability-tuples for those requirements
    const tuples = requirements.map(requirement => this.userCapabilities[requirement])
    // A single true grants access
    const explicitAllow = tuples.some(tuple => tuple[0] === true)
    if (explicitAllow) {
      return true
    }
    // All false denies access
    const allDisallow = tuples.every(tuple => tuple[0] === false)
    if (allDisallow) {
      return false
    }
    // Return all non-true/false rules we have
    return tuples.filter(tuple => tuple.length > 1)
  }

  assembleGrantsByActionAndType() {
    const allCapabilityTuples = {}
    actions.forEach(action => {
      allCapabilityTuples[action] = {}
      documentTypes.forEach(type => {
        const compressedCapabilities = this.compressCapabilities(action, type)
        if (compressedCapabilities) {
          allCapabilityTuples[action][type] = compressedCapabilities
        }
      })
    })
    return allCapabilityTuples
  }

  async determinePermissions() {
    await this.fetchAllCapabilities()
    const grantsByActionAndType = this.assembleGrantsByActionAndType()
    const filters = {}
    actions.forEach(action => {
      const queries = documentTypes
        .map(type => {
          const specificGrants = grantsByActionAndType[action][type]
          if (!specificGrants) {
            return null
          }
          if (specificGrants === true) {
            return `(_type == "${type}")`
          }
          const query = [`_type == "${type}"`, querifyTuples(specificGrants)].join(' && ')
          return `(${query})`
        })
        .filter(Boolean)
      filters[action] = `(${queries.join(' || ')})`
    })

    return {
      filters: filters,
      grants: grantsByActionAndType,
      capabilities: this.userCapabilities
    }
  }
}

module.exports = PermissionsBuilder
