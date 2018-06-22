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

  async getFilterExpressionsForUser(journalId, identityId) {
    if (identityId === SecurityManager.SYSTEM_IDENTITY) {
      return {} // Allow all
    }

    if (!this.userStore) {
      throw new Error('User store must be set before fetching filter expressions')
    }

    if (!identityId) {
      return anonymousFilterExpressions
    }

    const users = await this.userStore.fetchUsersForIdentity(identityId, journalId)
    if (users.length === 0) {
      return anonymousFilterExpressions
    }

    const [globalUser, journalUser] = users
    if (globalUser.isAdmin) {
      // No filters == allow everything
      return {}
    }

    return {
      create: 'false',
      read: 'false',
      update: 'false',
      delete: 'false'
    }
  }

  accessFilterChangesForUserIds(journalId, previousDoc, nextDoc) {
    return []
  }

  onMutation(mutation) {
    const journalId = mutation.annotations.journalId
    const changedFor = this.accessFilterChangesForUserIds(
      journalId,
      mutation.previous,
      mutation.result
    )

    changedFor.forEach(userId => {
      this.cache.del(getCacheKey(journalId, userId))
    })
  }
}

SecurityManager.SYSTEM_IDENTITY = '_system_'

function getCacheKey(journalId, userId) {
  return `sm-${journalId}-${userId}`
}

module.exports = SecurityManager
