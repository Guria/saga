const parseGROQ = require('./groq_js.js')

export default function parse(query, params) {
  const [json, err] = parseGROQ(query, params)
  if (err !== null) {
    throw err
  }
  return JSON.parse(json)
}