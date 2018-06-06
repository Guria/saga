const Boom = require('boom')
const uuid = require('uuid/v4')
const {omit} = require('lodash')
const {plan, parse, exec} = require('groq')
const endOfStream = require('end-of-stream')
const SseChannel = require('sse-channel')
const extendBoom = require('../../util/extendBoom')

module.exports = async (req, res, next) => {
  let messageIndex = 0
  const getMessageId = () => ++messageIndex + Date.now()

  const channel = new SseChannel({
    historySize: 250,
    jsonEncode: true,
    cors: false
  })

  channel.addClient(req, res)

  const {dataset} = req.params
  const {dataStore} = req.app.services
  const {query, includeResult, includePreviousRevision} = req.query
  const params = Object.keys(req.query)
    .filter(param => param.startsWith('$'))
    .reduce((acc, param) => {
      acc[param.slice(1)] = parseJson(param, req.query[param])
      return acc
    }, {})

  const store = await dataStore.forDataset(dataset)
  const omitProps = []
    .concat(includeResult ? [] : ['result'])
    .concat(includePreviousRevision ? [] : ['previous'])

  const emitOptions = {channel, params, query, omitProps}
  const onMutation = mut => emitOnMutationMatch(mut, getMessageId(), emitOptions)

  channel.send({id: getMessageId(), data: {listenerName: uuid()}, event: 'welcome'})

  store.on('mutation', onMutation)
  endOfStream(res, () => {
    store.removeListener('mutation', onMutation)
    channel.close()
  })
}

async function queryMatchesDocument(query, doc, params) {
  const operations = plan(parse(query, params))
  const results = await exec({operations, fetcher: spec => [doc]})
  return Array.isArray(results.value) && results.value.length > 0
}

async function emitOnMutationMatch(mut, messageId, options) {
  const {query, params, channel, omitProps} = options

  const matchesPrev = mut.previous && (await queryMatchesDocument(query, mut.previous, params))
  const matchesNext = mut.result && (await queryMatchesDocument(query, mut.result, params))

  let transition
  if (matchesPrev && matchesNext) {
    transition = 'update'
  } else if (matchesPrev) {
    transition = 'disappear'
  } else if (matchesNext) {
    transition = 'appear'
  } else {
    return
  }

  const data = omitProps.length > 0 ? omit(mut, omitProps) : mut

  channel.send({
    id: messageId,
    event: 'mutation',
    data: {...data, transition}
  })
}

function parseJson(key, value) {
  try {
    return JSON.parse(value)
  } catch (err) {
    throw extendBoom(Boom.badRequest('Invalid parameter'), {
      type: 'httpBadRequest',
      error: {
        description: `Unable to parse value of "${key}=${value}". Please quote string values.`
      }
    })
  }
}
