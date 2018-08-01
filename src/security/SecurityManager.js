const LruCache = require('lru-cache')

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
    this.cache = new LruCache({max: 500})
    this.onMutation = this.onMutation.bind(this)
  }

  setUserStore(userStore) {
    this.userStore = userStore
  }

  async getFilterExpressionsForUser(venueId, identityId) {
    if (identityId === SecurityManager.SYSTEM_IDENTITY) {
      return fullAccessFilterExpressions
    }

    if (!this.userStore) {
      throw new Error('User store must be set before fetching filter expressions')
    }

    if (!identityId) {
      return noAccessFilterExpressions
    }

    const {globalUser, venueUser} = await this.userStore.fetchUsersForIdentity(identityId, venueId)
    if ([globalUser, venueUser].filter(Boolean).length === 0) {
      return noAccessFilterExpressions
    }

    if (globalUser && globalUser.isAdmin) {
      return fullAccessFilterExpressions
    }
    if (venueUser && venueUser.isAdmin) {
      return fullAccessFilterExpressions
    }

    return noAccessFilterExpressions
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
