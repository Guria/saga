const request = require('supertest')
const {close, createSession, getApp, getSessionCookie} = require('./helpers')
const getId = require('randomstring').generate
const {noAccessFilterExpressions} = require('../src/security/defaultFilters')

describe('grants', () => {
  const identityTemplate = {
    provider: 'google',
    providerId: 'xyzzy',
    name: 'Profeten Thomax',
    email: 'thomas@sanity.io'
  }

  const dataset = 'saga-test'
  const systemDataset = 'saga-system-test'

  let app
  let scopedDataStore

  async function getScopedDataStore() {
    if (!scopedDataStore) {
      scopedDataStore = await app.services.dataStore.forDataset(dataset)
    }
    return scopedDataStore
  }

  async function createUser() {
    const userStore = app.services.userStore
    const identity = await userStore.createIdentity(identityTemplate)
    const user = await userStore.createUser(identity, 'saga-test')
    const sessionId = getId()
    await createSession(app, sessionId, identity._id)
    user.sessionId = sessionId
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

  beforeAll(() => {
    app = getApp()
  })

  beforeEach(() => {
    jest.setTimeout(15000)
  })

  afterAll(() => close(app))

  afterEach(() =>
    Promise.all(
      [systemDataset, dataset].map(dsName =>
        app.services.dataStore.forDataset(dsName).then(ds => ds.truncate())
      )
    ))

  test('returns no grants for logged out user', async () => {
    await request(app)
      .get(`/v1/grants/${dataset}`)
      .expect(200, {...noAccessFilterExpressions})
  })

  test('returns grants for logged in user', async () => {
    const user = await createUser()
    const expectedCapabilities = {
      isVenueEditor: 'false',
      isEditorInArticleTrack: 'false',
      isEditorInArticleIssues: 'false',
      isSubmitterInArticle: 'false',
      isCommentAuthor: `author._ref == "${user._id}"`,
      isEditorInIssueWithArticleInComment: 'false',
      isEditorInTrackWithArticleInComment: 'false',
      isEditorInIssueWithArticleInReviewProcess: 'false',
      isEditorInTrackWithArticleInReviewProcess: 'false',
      isReviewer: `reviewer._ref == "${user._id}"`,
      isEditorInIssueWithArticleInReviewItem: 'false',
      isEditorInTrackWithArticleInReviewItem: 'false',
      isSubmitterInArticleInFeatureState: 'false',
      isEditorInIssueWithArticleInFeatureState: 'false',
      isEditorInTrackWithArticleInFeatureState: 'false',
      isEditorInAnyIssue: 'false',
      isEditorInAnyTrack: 'false',
      isIssueEditor: 'false',
      isTrackEditor: 'false'
    }
    await request(app)
      .get(`/v1/grants/${dataset}`)
      .set('Cookie', getSessionCookie(app, user))
      .expect(200)
      .expect(result => {
        const userGrants = result.body
        expect(userGrants.read).toBeTruthy()
        expect(userGrants.create).toBeTruthy()
        expect(userGrants.update).toBeTruthy()
        expect(userGrants.delete).toBeTruthy()
        expect(userGrants.capabilities).toMatchObject(expectedCapabilities)
      })
  })
})
