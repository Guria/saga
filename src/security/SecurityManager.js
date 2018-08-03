const LruCache = require('lru-cache')
const AccessFilterBuilder = require('./AccessFilterBuilder')
const {noAccessFilterExpressions, fullAccessFilterExpressions} = require('./defaultFilters')

class SecurityManager {
  constructor(options = {}) {
    this.userStore = options.userStore
    this.dataStore = options.dataStore
    this.cache = new LruCache({max: 500})
    this.onMutation = this.onMutation.bind(this)
  }

  setUserStore(userStore) {
    this.userStore = userStore
  }

  confirmStoresArePresent() {
    if (!this.userStore) {
      throw new Error('User store must be set before fetching filter expressions')
    }
    if (!this.dataStore) {
      throw new Error('Data store must be set before fetching filter expressions')
    }
  }

  async getFilterExpressionsForUser(venueId, identityId) {
    if (!identityId) {
      return noAccessFilterExpressions
    }

    if (identityId === SecurityManager.SYSTEM_IDENTITY) {
      return fullAccessFilterExpressions
    }

    this.confirmStoresArePresent()

    const {globalUser, venueUser} = await this.userStore.fetchUsersForIdentity(identityId, venueId)

    if (globalUser) {
      // Will there ever be a globalUser who is not admin?
      return globalUser.isAdmin ? fullAccessFilterExpressions : noAccessFilterExpressions
    }
    if (venueUser) {
      const filterBuilder = new AccessFilterBuilder(venueUser._id, this.dataStore, venueId)
      return venueUser.isAdmin ? fullAccessFilterExpressions : filterBuilder.determineFilters()
    }

    return noAccessFilterExpressions
  }

  // Figure out which users must have there cached filters purged
  accessFilterChangesForUserIds(venueId, previousDoc, nextDoc) {
    return []
  }

  // Point of callback when a document changes
  onMutation(mutation) {
    const venueId = mutation.annotations.venueId
    const changedFor = this.accessFilterChangesForUserIds(
      venueId,
      mutation.previous,
      mutation.result
    )

    changedFor.forEach(userId => {
      this.cache.del(getCacheKey(venueId, userId))
    })
  }
}

SecurityManager.SYSTEM_IDENTITY = '_system_'

function getCacheKey(venueId, userId) {
  return `sm-${venueId}-${userId}`
}

module.exports = SecurityManager
