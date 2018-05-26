const randomstring = require('randomstring').generate

const applyDocumentId = doc => {
  if (!doc._id) {
    return {_id: randomstring(), ...doc}
  }

  if (doc._id.endsWith('.')) {
    return {_id: `${doc._id}${randomstring()}`, ...doc}
  }

  return doc
}

// Modify a set of mutations to include a generated document ID if none is given
module.exports = function applyDocumentIdToMutation(mutation, options) {
  const {operation, body} = mutation
  switch (operation) {
    case 'create':
    case 'createOrReplace':
    case 'createIfNotExists':
      return {operation, body: applyDocumentId(body)}
    default:
      // ignore, this patch does not need an id
      return mutation
  }
}
