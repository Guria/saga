const {close, getApp} = require('../helpers')
const AccessFilterBuilder = require('../../src/security/AccessFilterBuilder')

describe('accessFilterBuilder', () => {
  const identityTemplate = {
    provider: 'google',
    providerId: 'xyzzy',
    name: 'Profeten Thomax',
    email: 'thomas@sanity.io'
  }

  let app
  let scopedDataStore

  async function getScopedDataStore() {
    if (!scopedDataStore) {
      scopedDataStore = await app.services.dataStore.forDataset('saga-test')
    }
    return scopedDataStore
  }

  async function createUser() {
    const userStore = app.services.userStore
    const identity = await userStore.createIdentity(identityTemplate)
    const user = await userStore.createUser(identity, 'saga-test')
    return user
  }

  async function createDocument(doc) {
    const dataStore = await getScopedDataStore()
    const createdDocument = await dataStore
      .newTransaction({identity: '_system_'})
      .create(doc)
      .commit()
    return createdDocument
  }

  async function filtersForUser(userId) {
    const filterBuilder = new AccessFilterBuilder(userId, app.services.dataStore, 'saga-test')
    const filters = await filterBuilder.determineFilters()
    return filters
  }

  beforeAll(() => {
    app = getApp()
  })

  beforeEach(() => {
    jest.setTimeout(15000)
  })

  afterAll(() => close(app))

  afterEach(() =>
    Promise.all(
      ['saga-system-test', 'saga-test'].map(dsName =>
        app.services.dataStore.forDataset(dsName).then(ds => ds.truncate())
      )
    ))

  test('produces groq filters granting some read access to unprivileged user', async () => {
    const unprivilegedUser = await createUser()
    await createDocument({
      _type: 'venue',
      name: 'journal-of-snah'
    })
    const filters = await filtersForUser(unprivilegedUser._id)

    expect(filters).toBeTruthy()
    const expected = `((_type == "venue") || (_type == "issue") || (_type == "track") || (_type == "stage") || (_type == "user") || (_type == "comment" && (author._ref in ["${
      unprivilegedUser._id
    }"])) || (_type == "reviewItem" && (reviewer._ref in ["${
      unprivilegedUser._id
    }"])) || (_type == "featureConfig"))`
    expect(filters.read).toEqual(expected)
  })

  test('produces groq filters allowing comment author to update own comment', async () => {
    const author = await createUser()
    await createDocument({
      _type: 'comment',
      title: 'Stuff I chew on',
      author: {_type: 'reference', _ref: author._id}
    })
    const filters = await filtersForUser(author._id)

    const expected = `((_type == "comment" && (author._ref in ["${
      author._id
    }"])) || (_type == "reviewItem" && (reviewer._ref in ["${author._id}"])))`
    expect(filters.update).toEqual(expected)
  })

  // you break it you buy it
  test('sanity-check capabilities', async () => {
    const author = await createUser()
    await createDocument({
      _type: 'comment',
      title: 'Stuff I chew on',
      author: {_type: 'reference', _ref: author._id}
    })
    const filters = await filtersForUser(author._id)

    const expected = {
      create: {
        article: false,
        comment: true,
        featureConfig: false,
        featureState: false,
        issue: false,
        reviewItem: false,
        reviewProcess: false,
        stage: false,
        track: false,
        user: false,
        venue: false
      },
      delete: {
        article: false,
        comment: [['author._ref', [`${author._id}`]]],
        featureConfig: false,
        featureState: false,
        issue: false,
        reviewItem: [['reviewer._ref', [`${author._id}`]]],
        reviewProcess: false,
        stage: false,
        track: false,
        user: false,
        venue: false
      },
      read: {
        article: false,
        comment: [['author._ref', [`${author._id}`]]],
        featureConfig: true,
        featureState: false,
        issue: true,
        reviewItem: [['reviewer._ref', [`${author._id}`]]],
        reviewProcess: false,
        stage: true,
        track: true,
        user: true,
        venue: true
      },
      update: {
        article: false,
        comment: [['author._ref', [`${author._id}`]]],
        featureConfig: false,
        featureState: false,
        issue: false,
        reviewItem: [['reviewer._ref', [`${author._id}`]]],
        reviewProcess: false,
        stage: false,
        track: false,
        user: false,
        venue: false
      }
    }
    expect(filters.capabilities).toEqual(expected)
  })
})
