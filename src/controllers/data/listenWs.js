const uuid = require('uuid/v4')
const {omit} = require('lodash')
const {plan, parse, exec} = require('groq')
const formatRpcMessage = require('../../util/formatRpcMessage')

module.exports = async (msg, ws, req) => {
  const {dataset, app} = req
  const {dataStore, log} = app.services
  const {query, params, includeResult, includePreviousRevision} = msg.params
  const id = msg.id

  const store = await dataStore.forDataset(dataset)
  const omitProps = []
    .concat(includeResult ? [] : ['result'])
    .concat(includePreviousRevision ? [] : ['previous'])

  const emitOptions = {ws, id, params, query, omitProps}
  const onMutation = mut => emitOnMutationMatch(mut, emitOptions)

  ws.send(formatRpcMessage({listenerName: uuid(), event: 'welcome'}, msg.id, {stream: true}))

  store.on('mutation', onMutation)
  ws.on('close', () => {
    log.info('End of WS stream, unsubscribing from mutations')
    store.removeListener('mutation', onMutation)
  })
}

async function queryMatchesDocument(query, doc, params) {
  const operations = plan(parse(query, params))
  const results = await exec({operations, fetcher: spec => ({results: [doc], start: 0})})
  return Array.isArray(results.value) && results.value.length > 0
}

async function emitOnMutationMatch(mut, options) {
  const {id, query, params, ws, omitProps} = options

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

  ws.send(formatRpcMessage({...data, event: 'mutation', transition}, id))
}
