const parseGROQ = require('./groq_js.js')

module.exports = function parse(query, params) {
  [json, err] = parseGROQ(query, params)
  if (err !== null) {
    throw err
  }
  return JSON.parse(json)
}