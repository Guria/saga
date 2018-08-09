const {close, getApp} = require('./helpers')
const UserCapabilityDiviner = require('../src/security/UserCapabilityDiviner')

describe('userCapabilityDiviner', () => {
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
      scopedDataStore = await app.services.dataStore.forDataset('lyra-test')
    }
    return scopedDataStore
  }

  async function createUser() {
    const userStore = app.services.userStore
    const identity = await userStore.createIdentity(identityTemplate)
    const user = await userStore.createUser(identity, 'lyra-test')
    return user
  }

  async function createDocument(doc) {
    const dataStore = await getScopedDataStore()
    const createdDocument = await dataStore
      .newTransaction({identity: '_system_'})
      .create(doc)
      .commit()
    return createdDocument.results[0].document
  }

  async function capabilitiesForUser(userId) {
    const ucd = new UserCapabilityDiviner(userId, app.services.dataStore, 'lyra-test')
    const capabilities = await ucd.runAll()
    return capabilities
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
      ['lyra-system-test', 'lyra-test'].map(dsName =>
        app.services.dataStore.forDataset(dsName).then(ds => ds.truncate())
      )
    ))

  test('recognizes an user unprivileged user', async () => {
    const unprivilegedUser = await createUser()
    await createDocument({
      _type: 'venue',
      name: 'journal-of-snah'
    })
    const capabilities = await capabilitiesForUser(unprivilegedUser._id)

    expect(capabilities).toMatchObject({
      isVenueEditor: false
    })
  })

  test('recognizes a venue editor', async () => {
    const venueEditorUser = await createUser()
    await createDocument({
      _type: 'venue',
      name: 'journal-of-snah',
      editors: [{_type: 'reference', _ref: venueEditorUser._id}]
    })
    const capabilities = await capabilitiesForUser(venueEditorUser._id)
    expect(capabilities).toMatchObject({
      isVenueEditor: true
    })
  })

  test('recognizes article track editor', async () => {
    const articleTrackEditorUser = await createUser()

    const track = await createDocument({
      _id: 'TRACKID1234',
      _type: 'track',
      editors: [{_type: 'reference', _ref: articleTrackEditorUser._id}]
    })

    await createDocument({
      _type: 'article',
      title: 'Bubblegum',
      track: {_type: 'reference', _ref: track._id}
    })

    const capabilities = await capabilitiesForUser(articleTrackEditorUser._id)
    expect(capabilities).toMatchObject({isEditorInArticleTrack: 'track._ref in ["TRACKID1234"]'})
  })

  test('recognizes issue editor', async () => {
    const issueEditorUser = await createUser()

    await createDocument({
      _id: 'ARTICLEID1234',
      _type: 'article'
    })

    await createDocument({
      _id: 'ISSUEID1234',
      _type: 'issue',
      content: [
        {
          _type: 'section',
          title: 'A Section',
          articles: [{_type: 'reference', _ref: 'ARTICLEID1234'}]
        }
      ],
      editors: [{_type: 'reference', _ref: issueEditorUser._id}]
    })

    const capabilities = await capabilitiesForUser(issueEditorUser._id)
    expect(capabilities).toMatchObject({isEditorInArticleIssues: '_id in ["ARTICLEID1234"]'})
  })

  test('recognizes article submitter', async () => {
    const submitterUser = await createUser()

    await createDocument({
      _id: 'ARTICLEID1234',
      _type: 'article',
      submitters: [{_type: 'reference', _ref: submitterUser._id}]
    })

    const capabilities = await capabilitiesForUser(submitterUser._id)
    expect(capabilities).toMatchObject({isSubmitterInArticle: '_id in ["ARTICLEID1234"]'})
  })

  test('recognizes comment owner', async () => {
    const creator = await createUser()

    await createDocument({
      _id: 'COMMENTID1234',
      _type: 'comment',
      _createdBy: creator._id
    })

    const capabilities = await capabilitiesForUser(creator._id)
    expect(capabilities).toMatchObject({isCreator: `_createdBy == "${creator._id}"`})
  })

  test('recognizes issue editors in reviewProcess', async () => {
    const issueEditorUser = await createUser()

    await createDocument({
      _id: 'ARTICLEID1234',
      _type: 'article'
    })

    await createDocument({
      _id: 'ISSUEID1234',
      _type: 'issue',
      content: [
        {
          _type: 'section',
          title: 'A Section',
          articles: [{_type: 'reference', _ref: 'ARTICLEID1234'}]
        }
      ],
      editors: [{_type: 'reference', _ref: issueEditorUser._id}]
    })

    await createDocument({
      _id: 'REVIEWPROCESSID1234',
      _type: 'reviewProcess',
      article: {_type: 'reference', _ref: 'ARTICLEID1234'}
    })

    const capabilities = await capabilitiesForUser(issueEditorUser._id)
    expect(capabilities).toMatchObject({
      isEditorInIssueWithArticleInReviewProcess: 'article._ref in ["ARTICLEID1234"]'
    })
  })

  test('recognizes track editors in reviewProcess', async () => {
    const articleTrackEditorUser = await createUser()

    const track = await createDocument({
      _id: 'TRACKID1234',
      _type: 'track',
      editors: [{_type: 'reference', _ref: articleTrackEditorUser._id}]
    })

    await createDocument({
      _id: 'ARTICLEID1234',
      _type: 'article',
      track: {_type: 'reference', _ref: track._id}
    })

    await createDocument({
      _id: 'REVIEWPROCESSID1234',
      _type: 'reviewProcess',
      article: {_type: 'reference', _ref: 'ARTICLEID1234'}
    })

    const capabilities = await capabilitiesForUser(articleTrackEditorUser._id)
    expect(capabilities).toMatchObject({
      isEditorInTrackWithArticleInReviewProcess: 'article._ref in ["ARTICLEID1234"]'
    })
  })
})
