// Psuedo-code in terms of serializing, import part is message format

// ================================ //
// === Client:                  === //
// ================================ //
const ws = new WebSocket('ws://:projectId.api.sanity.io/v1/data/channel/:datasetName')
ws.send({
  requestId: 'client-provided-id',
  type: 'listen',
  args: {
    query: '*[_type == $type]',
    params: {type: 'article'},
    includeResult: true
  }
})

ws.send({
  requestId: 'client-provided-id',
  type: 'cancel'
})

ws.send({
  requestId: 'foo',
  type: 'cancelled',
  done: true
})

// ================================ //
// === Server:                  === //
// ================================ //
ws.send({
  requestId: 'client-provided-id',
  type: 'mutation',
  done: false,

  // Data contains the same data as the SSE-messages do
  data: {
    type,
    eventId,
    documentId,
    transactionId,
    identity,
    resultRev,
    timestamp,
    previousRev,
    previous,
    mutations,
    result,
    transition
  }
})

// In case of error (say, incorrect query):
ws.send({
  requestId: 'client-provided-id',
  type: 'requestError',
  done: true,
  data: {
    error: {
      description: "Expected ']' following expression",
      start: 1,
      end: 19,
      query: '*[_type == campaign',
      type: 'queryParseError'
    }
  }
})
