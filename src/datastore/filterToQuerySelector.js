// Accepts a filter according to the groq/operations model and translates it
// to a MongoDB Query Selector to the maximum extent possible

module.exports = function filterToQuerySelector(filter) {
  if (filter) {
    return transform(filter)
  }
  return {}
}

// This is just a rough prototype, works only for the most trivial
// cases imaginable
function transform(operation) {
  switch (operation.op) {
    case 'and':
      return {"$and": [transform(operation.lhs), transform(operation.rhs)]}
    case 'eq':
      return {
        [operation.lhs.path.map(oper => oper.name).join('.')]: transform(operation.rhs)
      }
    case 'literal':
      return operation.value
  }
}
