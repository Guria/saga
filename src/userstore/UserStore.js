const removeUndefined = require('../util/removeUndefined')
const SecurityManager = require('../security/SecurityManager')

module.exports = class UserStore {
  constructor(options) {
    this.dataStore = options.dataStore
    this.identityStore = this.dataStore.forDataset(options.systemDb)
  }

  async connect() {
    this.identityStore = await this.identityStore
    return this.identityStore
  }

  async fetchIdentityById(id) {
    await this.connect()
    return this.identityStore.getDocumentById(id)
  }

  async fetchIdentity(provider, providerId) {
    await this.connect()
    return this.identityStore.fetch(
      '*[_type == "identity" && provider == $provider && providerId == $providerId][0]',
      {provider, providerId}
    )
  }

  async createIdentity(identity) {
    const {provider, providerId, name, email, externalProfileImageUrl} = identity
    await this.connect()
    return this.identityStore
      .newTransaction({identity: SecurityManager.SYSTEM_IDENTITY})
      .create({
        _type: 'identity',
        provider,
        providerId,
        name,
        email,
        externalProfileImageUrl
      })
      .commit()
      .then(getFirstDocument)
  }

  async claimUser(userId, identity, journalId = null, props = {}) {
    const {name, email, profileImage, externalProfileImageUrl} = props
    const store = await (journalId ? this.dataStore.forDataset(journalId) : this.connect())
    const userProps = removeUndefined({
      identity,
      name,
      email,
      profileImage,
      externalProfileImageUrl
    })

    return store
      .newTransaction({identity: SecurityManager.SYSTEM_IDENTITY})
      .patch(userId, patch => patch.set(userProps))
      .commit()
      .then(getFirstDocument)
  }

  async createAdminUser(identity = {}, journalId = null) {
    const {_id, name, email, profileImage} = identity
    const externalProfileImageUrl = profileImage

    const store = await (journalId ? this.dataStore.forDataset(journalId) : this.connect())
    return store
      .newTransaction({identity: SecurityManager.SYSTEM_IDENTITY})
      .create({
        _type: 'user',
        identity: _id,
        isAdmin: true,
        name,
        email,
        externalProfileImageUrl
      })
      .commit()
      .then(getFirstDocument)
  }

  async fetchUsersForIdentity(identityId, journalId = null) {
    const getUserForIdentity = store => {
      return store.fetch('*[_type == "user" && identity == $identityId][0]', {identityId})
    }

    const globalUser = this.connect().then(getUserForIdentity)
    if (!journalId) {
      return [await globalUser].filter(Boolean)
    }

    const journalUser = this.dataStore.forDataset(journalId).then(getUserForIdentity)
    return Promise.all([globalUser, journalUser]).then(users => users.filter(Boolean))
  }
}

function getFirstDocument(result) {
  return result.results[0].document
}
