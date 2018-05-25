// Modify a set of mutations to include the required timestamps
module.exports = function timeStampMutations(mutations, timestamp) {
  const isoTimeStamp = timestamp.toISOString()
  return mutations.reduce((result, mutation) => {
    const operation = Object.keys(mutation)[0]
    const body = mutation[operation]

    switch (operation) {
      case 'create':
      case 'createOrReplace':
      case 'createIfNotExists':
        result.push({
          [operation]: {
            ...body,
            _createdAt: body._createdAt || isoTimeStamp,
            _updatedAt: body._updatedAt || isoTimeStamp
          }
        })
        break
      case 'patch':
        result.push({
          patch: {
            ...body,
            set: {
              ...(body.set || {}),
              _updatedAt: isoTimeStamp
            }
          }
        })
        break
      default:
        // ignore, this patch does not need a timestamp
        result.push(mutation)
    }

    return result
  }, [])
}
