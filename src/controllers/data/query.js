const groqQuery = require('../../groq/query')

async function performQuery(options, req, res, next) {
  const start = Date.now()
  const {dataStore} = req.app.services
  const {dataset} = req.params
  const {query, params} = options

  const store = await dataStore.forDataset(dataset)
  const results = await groqQuery(query, params, store.fetch)
  const result = typeof results === 'undefined' ? null : results
  res.json({ms: Date.now() - start, query, result})
}

const get = (req, res, next) => {
  const params = Object.keys(req.query)
    .filter(param => param.startsWith('$'))
    .reduce((acc, param) => {
      acc[param.slice(1)] = JSON.parse(req.query[param])
      return acc
    }, {})

  const query = req.query.query
  return performQuery({query, params}, req, res, next)
}

const post = (req, res, next) => performQuery(req.body, req, res, next)

module.exports = {get, post}
