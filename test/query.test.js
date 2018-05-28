const request = require('supertest')
const uuid = require('uuid/v4')
const {close, getApp} = require('./helpers')

describe('query', () => {
  let app

  beforeAll(() => {
    app = getApp()
  })

  afterAll(() => {
    close(app)
  })

  afterEach(async () => {
    const ds = await app.services.dataStore.forDataset('lyra-test')
    return ds.truncate()
  })

  test('can create and query for document', async () => {
    const doc = {_id: 'foo', _type: 'test', random: uuid()}
    const transactionId = uuid()
    await request(app)
      .post('/v1/data/mutate/lyra-test?returnIds=true')
      .send({mutations: [{create: doc}], transactionId})
      .expect(200, {
        transactionId,
        results: [{id: doc._id, operation: 'create'}]
      })

    await request(app)
      .get(`/v1/data/query/lyra-test/?query=${encodeURIComponent(`*[_id == "${doc._id}"]`)}`)
      .expect(200)
      .expect(res => {
        expect(res.body.result).toHaveLength(1)
        expect(res.body.result[0]).toMatchObject(doc)
      })
  })
})
