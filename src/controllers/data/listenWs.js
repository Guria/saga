const {omit} = require('lodash')
const {query: execQuery} = require('groq')
const WebSocket = require('ws')
const formatRpcMessage = require('../../util/formatRpcMessage')
const securityManager = require('../../security/securityManager')

module.exports = listen

const listeners = new Map()

async function listen(msg, ws, req) {
  const {dataset, app} = req
  const {dataStore, log} = app.services
  const {query, params, includeResult, includePreviousRevision} = msg.params || {}
  const id = msg.id

  const store = await dataStore.forDataset(dataset)
  const omitProps = []
    .concat(includeResult ? [] : ['result'])
    .concat(includePreviousRevision ? [] : ['previous'])

  const filterOptions = {
    user: req.user && req.user.id,
    dataset
  }

  const emitOptions = {ws, id, params, query, omitProps, filterOptions}
  const onMutation = mut => emitOnMutationMatch(mut, emitOptions)
  const cancel = () => {
    log.info('Cancelling listener with ID %s', id)
    listeners.delete(id)
    store.removeListener('mutation', onMutation)
    return ws
  }

  listeners.set(id, {cancel})
  send(ws, formatRpcMessage({listenerName: id, type: 'welcome'}, id, {stream: true}))
  store.on('mutation', onMutation)
  ws.on('close', cancel)
}

listen.cancel = (msg, ws, req) =>
  listeners.has(msg.id) &&
  listeners.get(msg.id).cancel() &&
  send(ws, formatRpcMessage({type: 'complete'}, msg.id, {complete: true}))

function send(ws, data) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(data)
  }
}

async function queryMatchesDocument(query, doc, params, filterOptions) {
  const {dataset, user} = filterOptions
  const globalFilter = securityManager.getFilterExpressionsForUser(dataset, user).read

  const results = await execQuery({
    source: query,
    globalFilter: globalFilter,
    params,
    fetcher: spec => ({results: [doc], start: 0})
  })

  return Array.isArray(results.value) && results.value.length > 0
}

async function emitOnMutationMatch(mut, options) {
  const {id, query, params, ws, omitProps, filterOptions} = options

  const matchesPrev =
    mut.previous && (await queryMatchesDocument(query, mut.previous, params, filterOptions))

  const matchesNext =
    mut.result && (await queryMatchesDocument(query, mut.result, params, filterOptions))

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

  send(ws, formatRpcMessage({...data, type: 'mutation', transition}, id))
}
