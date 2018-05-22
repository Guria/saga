function performQuery(options, req, res, next) {
  const {query, params} = options
  res.json({ms: 7, query, result: []})
}

const get = (req, res, next) => {
  const params = Object.keys(req.query)
    .filter(param => param.startsWith('$'))
    .reduce((acc, param) => {
      acc[param.slice(1)] = req.query[param]
      return acc
    })

  const query = req.query.query
  return performQuery({query, params}, req, res, next)
}

const post = (req, res, next) => performQuery(req.body, req, res, next)

module.exports = {get, post}
