const LruCache = require('lru-cache')

const cache = new LruCache({max: 500})

const anonymousFilterExpressions = {
  create: undefined,
  read: undefined,
  update: undefined,
  delete: undefined
}

const securityManager = {
  getFilterExpressionsForUser(journalId, userId) {
    if (!userId) {
      return anonymousFilterExpressions
    }

    return {
      create: 'false',
      read: 'false',
      update: 'false',
      delete: 'false'
    }
  },

  accessFilterChangesForUserIds(journalId, previousDoc, nextDoc) {
    return []
  },

  onMutation(mutation) {
    const journalId = mutation.annotations.journalId
    const changedFor = securityManager.accessFilterChangesForUserIds(
      journalId,
      mutation.previous,
      mutation.result
    )

    changedFor.forEach(userId => {
      cache.del(this.getCacheKey(journalId, userId))
    })
  },

  getCacheKey(journalId, userId) {
    return `sm-${journalId}-${userId}`
  }
}

module.exports = securityManager
