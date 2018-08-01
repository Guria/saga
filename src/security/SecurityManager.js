const LruCache = require('lru-cache')
const determineAccessFilters = require('./determineAccessFilters')

const noAccessFilterExpressions = {
  create: 'false',
  read: 'false',
  update: 'false',
  delete: 'false'
}

const fullAccessFilterExpressions = {}

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
    if ([globalUser, venueUser].filter(Boolean).length === 0) {
      return noAccessFilterExpressions
    }

    if ((globalUser && globalUser.isAdmin) || (venueUser && venueUser.isAdmin)) {
      return fullAccessFilterExpressions
    }

    return determineAccessFilters(identityId, venueId, {
      defaultFilters: noAccessFilterExpressions,
      dataStore: this.dataStore
    })
  }

  accessFilterChangesForUserIds(venueId, previousDoc, nextDoc) {
    return []
  }

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
