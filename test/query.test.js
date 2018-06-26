const request = require('supertest')
const uuid = require('uuid/v4')
const {sortBy} = require('lodash')
const {close, getApp, createAdminUser, getSessionCookie} = require('./helpers')

describe('query', () => {
  let app
  let adminUser

  beforeAll(() => {
    app = getApp()
  })

  beforeEach(async () => {
    jest.setTimeout(15000)

    const dataStore = app.services.dataStore
    await Promise.all([
      dataStore.forDataset('lyra-test').then(ds => ds.truncate()),
      dataStore.forDataset('lyra-system-test').then(ds => ds.truncate())
    ])

    adminUser = await createAdminUser(app)
  })

  afterAll(() => close(app))

  test('can create and query for document', async () => {
    const doc = {_id: 'foo', _type: 'test', random: uuid()}
    const transactionId = uuid()
    await request(app)
      .post('/v1/data/mutate/lyra-test?returnIds=true')
      .set('Cookie', getSessionCookie(app, adminUser))
      .send({mutations: [{create: doc}], transactionId})
      .expect(200, {
        transactionId,
        results: [{id: doc._id, operation: 'create'}]
      })

    await request(app)
      .get(`/v1/data/query/lyra-test/?query=${encodeURIComponent(`*[_id == "${doc._id}"]`)}`)
      .set('Cookie', getSessionCookie(app, adminUser))
      .expect(200)
      .expect(res => {
        expect(res.body.result).toHaveLength(1)
        expect(res.body.result[0]).toMatchObject(doc)
      })
  })

  test('can query with joins', async () => {
    const bar = {_id: 'bar', _type: 'test', isBar: true}
    const foo = {_id: 'foo', _type: 'test', isBar: false, bar: {_ref: 'bar'}}
    const transactionId = uuid()
    await request(app)
      .post('/v1/data/mutate/lyra-test?returnIds=true')
      .set('Cookie', getSessionCookie(app, adminUser))
      .send({mutations: [{create: bar}, {create: foo}], transactionId})
      .expect(200, {
        transactionId,
        results: [{id: bar._id, operation: 'create'}, {id: foo._id, operation: 'create'}]
      })

    await request(app)
      .get(
        `/v1/data/query/lyra-test/?query=${encodeURIComponent(
          `*[_id == "foo"]{isBar, "bar": bar->{isBar}}`
        )}`
      )
      .set('Cookie', getSessionCookie(app, adminUser))
      .expect(200)
      .expect(res => {
        expect(res.body.result).toHaveLength(1)
        expect(res.body.result[0]).toMatchObject({
          isBar: false,
          bar: {isBar: true}
        })
      })

    await request(app)
      .get(`/v1/data/query/lyra-test/?query=${encodeURIComponent('*[references("bar")]{_id}')}`)
      .set('Cookie', getSessionCookie(app, adminUser))
      .expect(200)
      .expect(res => {
        expect(res.body.result).toHaveLength(1)
        expect(res.body.result[0]).toMatchObject({_id: 'foo'})
      })
  })

  test('can query ordering, limit and offset', async () => {
    const documents = [
      {_type: 'test', i: 88},
      {_type: 'test', i: 3},
      {_type: 'test', i: 1},
      {_type: 'test', i: 1337},
      {_type: 'test', i: 0.55},
      {_type: 'test', i: 16},
      {_type: 'test', i: 0.33},
      {_type: 'test', i: 16}
    ]

    const sorted = sortBy(documents, 'i')
      .slice(1, 6)
      .map(doc => doc.i)

    await request(app)
      .post('/v1/data/mutate/lyra-test?returnIds=true')
      .set('Cookie', getSessionCookie(app, adminUser))
      .send({mutations: documents.map(create => ({create}))})
      .expect(200)

    await request(app)
      .get(
        `/v1/data/query/lyra-test/?query=${encodeURIComponent(
          `*[_type == "test"] | order (i asc) [1...6]`
        )}`
      )
      .set('Cookie', getSessionCookie(app, adminUser))
      .expect(200)
      .expect(res => {
        expect(res.body.result).toHaveLength(sorted.length)
        expect(res.body.result.map(doc => doc.i)).toEqual(sorted)
      })
  })
})
