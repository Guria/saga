const request = require('supertest')
const uuid = require('uuid/v4')
const {close, getApp} = require('./helpers')

describe('mutations', () => {
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

  test('can create and fetch document', async () => {
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
      .get(`/v1/data/doc/lyra-test/${doc._id}`)
      .expect(200)
      .expect(res => {
        expect(res.body.documents).toHaveLength(1)
        expect(res.body.documents[0]).toMatchObject(doc)
      })
  })

  test('can create, replace and delete document', async () => {
    let random = uuid()
    const doc = {_id: uuid(), _type: 'test', random}
    const transactionId = uuid()

    // Create
    await request(app)
      .post('/v1/data/mutate/lyra-test?returnIds=true')
      .send({mutations: [{create: doc}], transactionId})
      .expect(200, {
        transactionId,
        results: [{id: doc._id, operation: 'create'}]
      })

    await request(app)
      .get(`/v1/data/doc/lyra-test/${doc._id}`)
      .expect(200)
      .expect(res => {
        expect(res.body.documents).toHaveLength(1)
        expect(res.body.documents[0]).toMatchObject(doc)
      })

    // Replace
    random = uuid()
    await request(app)
      .post('/v1/data/mutate/lyra-test?returnIds=true')
      .send({mutations: [{createOrReplace: {...doc, random}}], transactionId})
      .expect(200, {
        transactionId,
        results: [{id: doc._id, operation: 'update'}]
      })

    await request(app)
      .get(`/v1/data/doc/lyra-test/${doc._id}`)
      .expect(200)
      .expect(res => {
        expect(res.body.documents).toHaveLength(1)
        expect(res.body.documents[0]).toMatchObject({...doc, random})
      })

    // Delete
    await request(app)
      .post('/v1/data/mutate/lyra-test?returnIds=true')
      .send({mutations: [{delete: {id: doc._id}}], transactionId})
      .expect(200, {
        transactionId,
        results: [{id: doc._id, operation: 'delete'}]
      })

    await request(app)
      .get(`/v1/data/doc/lyra-test/${doc._id}`)
      .expect(200)
      .expect(res => {
        expect(res.body.documents).toHaveLength(0)
      })
  })

  test('can use createOrReplace to both create and replace a document', async () => {
    let random = uuid()
    const doc = {_id: uuid(), _type: 'test', random}
    const transactionId = uuid()

    // Create
    await request(app)
      .post('/v1/data/mutate/lyra-test?returnIds=true')
      .send({mutations: [{createOrReplace: doc}], transactionId})
      .expect(200, {
        transactionId,
        results: [{id: doc._id, operation: 'create'}]
      })

    await request(app)
      .get(`/v1/data/doc/lyra-test/${doc._id}`)
      .expect(200)
      .expect(res => {
        expect(res.body.documents).toHaveLength(1) // Create
        expect(res.body.documents[0]).toMatchObject(doc)
      })

    // Replace
    random = uuid()
    await request(app)
      .post('/v1/data/mutate/lyra-test?returnIds=true')
      .send({mutations: [{createOrReplace: {...doc, random}}], transactionId})
      .expect(200, {
        transactionId,
        results: [{id: doc._id, operation: 'update'}]
      })

    await request(app)
      .get(`/v1/data/doc/lyra-test/${doc._id}`)
      .expect(200)
      .expect(res => {
        expect(res.body.documents).toHaveLength(1) // Replace
        expect(res.body.documents[0]).toMatchObject({...doc, random})
      })
  })

  test('can create and patch document', async () => {
    const doc = {_id: 'datpatch', _type: 'test', random: uuid(), counter: 1}
    const transactionId = uuid()
    await request(app)
      .post('/v1/data/mutate/lyra-test?returnIds=true')
      .send({mutations: [{create: doc}], transactionId})
      .expect(200, {
        transactionId,
        results: [{id: doc._id, operation: 'create'}]
      })

    const random = uuid()
    await request(app)
      .post('/v1/data/mutate/lyra-test?returnIds=true')
      .send({mutations: [{patch: {id: doc._id, set: {random}, inc: {counter: 1}}}], transactionId})
      .expect(200, {
        transactionId,
        results: [{id: doc._id, operation: 'update'}]
      })

    await request(app)
      .get(`/v1/data/doc/lyra-test/${doc._id}`)
      .expect(200)
      .expect(res => {
        expect(res.body.documents).toHaveLength(1)
        expect(res.body.documents[0]).toMatchObject({...doc, random, counter: doc.counter + 1})
      })
  })

  test('performs mutations in the order they are received', async () => {
    const doc = {_id: 'target', _type: 'test', counter: 1}
    await request(app)
      .post('/v1/data/mutate/lyra-test?returnIds=true')
      .send({mutations: [{create: doc}]})
      .expect(200)

    const ops = []
    for (let i = 0; i <= 20; i++) {
      ops.push(
        request(app)
          .post('/v1/data/mutate/lyra-test?returnIds=true&returnDocuments=true')
          .send({mutations: [{patch: {id: doc._id, set: {counter: i}}}]})
          .expect(200)
          .then(res => expect(res.body.results[0]).toHaveProperty('document._id'))
      )
    }

    await Promise.all(ops)

    await request(app)
      .get(`/v1/data/doc/lyra-test/${doc._id}`)
      .expect(200)
      .expect(res => {
        expect(res.body.documents).toHaveLength(1)
        expect(res.body.documents[0]).toMatchObject({...doc, counter: 20})
      })
  })

  test('generates document ID if none is given', async () => {
    const doc = {_type: 'test', random: uuid()}
    await request(app)
      .post('/v1/data/mutate/lyra-test?returnIds=true')
      .send({mutations: [{create: doc}]})
      .expect(200)
      .then(res => {
        expect(res.body.results[0]).toHaveProperty('id')
        doc._id = res.body.results[0].id
      })

    await request(app)
      .get(`/v1/data/doc/lyra-test/${doc._id}`)
      .expect(200)
      .expect(res => {
        expect(res.body.documents).toHaveLength(1)
        expect(res.body.documents[0]).toMatchObject(doc)
      })
  })

  test('generates document ID if prefix given', async () => {
    const doc = {_id: 'test.', _type: 'test', random: uuid()}
    await request(app)
      .post('/v1/data/mutate/lyra-test?returnIds=true')
      .send({mutations: [{create: doc}]})
      .expect(200)
      .then(res => {
        expect(res.body.results[0]).toHaveProperty('id')
        doc._id = res.body.results[0].id
        expect(doc._id).toMatch(/^test\.[a-zA-Z0-9]{16,}$/)
      })

    await request(app)
      .get(`/v1/data/doc/lyra-test/${doc._id}`)
      .expect(200)
      .expect(res => {
        expect(res.body.documents).toHaveLength(1)
        expect(res.body.documents[0]).toMatchObject(doc)
      })
  })
})
