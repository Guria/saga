const LruCache = require('lru-cache')

const anonymousFilterExpressions = {
  create: 'false',
  read: 'false',
  update: 'false',
  delete: 'false'
}

class SecurityManager {
  constructor(options = {}) {
    this.userStore = options.userStore
    this.cache = new LruCache({max: 500})
    this.onMutation = this.onMutation.bind(this)
  }

  setUserStore(userStore) {
    this.userStore = userStore
  }

  async getFilterExpressionsForUser(venueId, identityId) {
    if (identityId === SecurityManager.SYSTEM_IDENTITY) {
      return {} // Allow all
    }

    if (!this.userStore) {
      throw new Error('User store must be set before fetching filter expressions')
    }

    if (!identityId) {
      return anonymousFilterExpressions
    }

    const {globalUser, venueUser} = await this.userStore.fetchUsersForIdentity(identityId, venueId)
    if ([globalUser, venueUser].filter(Boolean).length === 0) {
      return anonymousFilterExpressions
    }

    if (globalUser && globalUser.isAdmin) {
      // No filters == allow everything
      return {}
    }
    if (venueUser && venueUser.isAdmin) {
      // No filters == allow everything
      return {}
    }

    return anonymousFilterExpressions
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
