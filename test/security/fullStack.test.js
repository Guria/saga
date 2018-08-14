const request = require('supertest')
const {close, createSession, getApp, getSessionCookie} = require('../helpers')
const getId = require('randomstring').generate

describe('fullStack', () => {
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
      ['saga-system-test', 'saga-test'].map(dsName =>
        app.services.dataStore.forDataset(dsName).then(ds => ds.truncate())
      )
    ))

  test('allows any logged in user to read venue', async () => {
    const unprivilegedUser = await createUser()
    const venue = await createDocument({
      _type: 'venue',
      name: 'journal-of-snah'
    })
    const query = `*[_id == "${venue._id}"]`
    await request(app)
      .get(`/v1/data/query/saga-test/?query=${encodeURIComponent(query)}`)
      .set('Cookie', getSessionCookie(app, unprivilegedUser))
      .expect(200)
      .expect(res => {
        const {result} = res.body
        expect(result).toHaveLength(1)
        expect(result[0]).toMatchObject(venue)
      })
  })

  test('grants article read access to submitter but not to unprivileged user', async () => {
    const submitter = await createUser()
    const unprivilegedUser = await createUser()
    const article = await createDocument({
      _type: 'article',
      title: 'Bubblegum',
      submitters: [{_type: 'reference', _ref: submitter._id}]
    })

    const query = '*[_type == "article"]'

    await request(app)
      .get(`/v1/data/query/saga-test/?query=${encodeURIComponent(query)}`)
      .set('Cookie', getSessionCookie(app, submitter))
      .expect(200)
      .expect(res => {
        const {result} = res.body
        expect(result).toHaveLength(1)
        expect(result[0]).toMatchObject(article)
      })

    await request(app)
      .get(`/v1/data/query/saga-test/?query=${encodeURIComponent(query)}`)
      .set('Cookie', getSessionCookie(app, unprivilegedUser))
      .expect(200)
      .expect(res => {
        const {result} = res.body
        expect(result).toHaveLength(0)
      })
  })

  test('grants comment update access to author', async () => {
    const author = await createUser()

    const comment = await createDocument({
      _type: 'comment',
      title: 'Stuff I chew on',
      author: {_type: 'reference', _ref: author._id}
    })

    const transactionId = getId()
    await request(app)
      .post('/v1/data/mutate/saga-test?returnIds=true')
      .set('Cookie', getSessionCookie(app, author))
      .send({
        mutations: [{patch: {id: comment._id, set: {title: 'Other stuff'}}}],
        transactionId
      })
      .expect({
        transactionId,
        results: [{id: comment._id, operation: 'update'}]
      })
  })
})
