const LruCache = require('lru-cache')
const PermissionsBuilder = require('./PermissionsBuilder')
const {noPermissions, adminPermissions} = require('./securityConstants')

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

  async getPermissionsForUser(venueId, identityId) {
    if (!identityId) {
      return noPermissions
    }

    if (identityId === SecurityManager.SYSTEM_IDENTITY) {
      return adminPermissions
    }

    this.confirmStoresArePresent()

    const {globalUser, venueUser} = await this.userStore.fetchUsersForIdentity(identityId, venueId)
    console.info('🦄', `hasGlobalUser: ${!!globalUser} // hasVenueUser: ${!!venueUser}`)

    if (globalUser) {
      // Will there ever be a globalUser who is not admin?
      return globalUser.isAdmin ? adminPermissions : noPermissions
    }
    if (venueUser) {
      const permissionsBuilder = new PermissionsBuilder(venueUser._id, this.dataStore, venueId)
      return venueUser.isAdmin ? adminPermissions : permissionsBuilder.determineFilters()
    }

    return noPermissions
  }

  // Figure out which users must have their cached filters purged
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
