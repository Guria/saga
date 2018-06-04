const util = require('util')
const {merge} = require('lodash')
const {plan, parse, exec} = require('groq')

// eslint-disable-next-line no-console
const log = ast => console.log(util.inspect(ast, {colors: true, depth: 15}))

module.exports = {
  toMongo,
  fetchForSpec,
  query
}

async function query(collection, groqQuery, params = {}) {
  const operations = plan(parse(groqQuery, params))
  const results = await exec({operations, fetcher: spec => fetchForSpec(collection, spec)})
  return results.value
}

function fetchForSpec(collection, spec) {
  const sort = spec.ordering.map(fromNode)
  const filter = spec.filter ? fromNode(spec.filter) : {}
  const end = Math.max(0, spec.end || 100)
  const start = Math.max(0, (spec.start || 0) - 1)
  return collection
    .find(filter)
    .skip(start)
    .limit(end - start)
    .sort(sort)
    .toArray()
}

function toMongo(node) {
  return fromNode(node)
}

// eslint-disable-next-line complexity
function fromNode(node) {
  switch (node.op) {
    case 'pipe':
      return fromPipe(node)
    case 'source':
      return fromSource(node)
    case 'filter':
      return wrapQuery(fromFilter(node))
    case 'not':
      return fromNotOperator(node)
    case 'and':
      return fromAndOperator(node)
    case 'or':
      return fromOrOperator(node)
    case 'eq':
      return fromEqualityFilter(node)
    case 'neq':
      return fromInequalityFilter(node)
    case 'gt':
      return fromGreaterThanFilter(node)
    case 'gte':
      return fromGreaterThanOrEqualFilter(node)
    case 'lt':
      return fromLessThanFilter(node)
    case 'lte':
      return fromLessThanOrEqualFilter(node)
    case 'in':
      return fromInFilter(node)
    case 'match':
      return fromMatchFilter(node)
    case 'accessor':
      return fromAccessor(node)
    case 'attribute':
      return fromAttribute(node)
    case 'literal':
      return fromLiteral(node)
    case 'array':
      return fromArray(node)
    case 'subscript':
      return fromSubscript(node)
    case 'functionCall':
      return fromFunctionCall(node)
    case 'sortDirection':
      return fromSortDirection(node)
    case 'ordering':
      return fromOrdering(node)
    default:
      throw new Error(`toMongo: Unknown node operation "${node.op}"`)
  }
}

function fromSource(node) {
  return {query: {}}
}

function fromPipe(pipe) {
  // Use for loop instead of reduce to be able to bail early in case of short-circuiting
  let acc = {query: {}, limit: 100, offset: 0, returnFirst: false, sort: []}
  for (let i = 0; i < pipe.operations.length; i++) {
    const node = pipe.operations[i]
    const result = fromNode(node)
    const isShortCircuit = result && typeof result.query === 'boolean'
    if (isShortCircuit && result.query === true) {
      continue
    } else if (isShortCircuit) {
      return {query: false}
    }

    acc = merge(acc, result)
  }

  return acc
}

function fromAndOperator(node) {
  return {$and: [node.lhs, node.rhs].map(asFilter)}
}

function fromOrOperator(node) {
  return {$or: [node.lhs, node.rhs].map(asFilter)}
}

function asFilter(node) {
  // *[isPublished] -> {isPublished: true}
  if (isAccessor(node)) {
    return fromEqualityFilter({
      op: 'eq',
      lhs: node,
      rhs: {op: 'literal', type: 'bool', value: true}
    })
  }

  return fromNode(node)
}

function fromFilter(node) {
  // *[isPublished] -> {isPublished: true}
  if (node.filter.op === 'accessor') {
    return asFilter(node.filter)
  }

  return fromNode(node.filter)
}

function fromNotOperator(node) {
  const rhs = fromNode(node.rhs)
  if (typeof rhs === 'boolean') {
    return !rhs
  }

  return {$nor: [fromNode(node.rhs)]}
}

function fromEqualityFilter(node) {
  const {type, lhs, rhs} = filterParts(node)
  if (type === 'literalComparison') {
    return lhs === rhs
  }

  if (type === 'fieldComparison') {
    return {$expr: {$eq: [`$${lhs}`, `$${rhs}`]}}
  }

  return {[lhs]: rhs}
}

function fromInequalityFilter(node) {
  const {type, lhs, rhs} = filterParts(node)
  if (type === 'literalComparison') {
    return lhs !== rhs
  }

  if (type === 'fieldComparison') {
    return {$expr: {$ne: [`$${lhs}`, `$${rhs}`]}}
  }

  return {[lhs]: {$ne: rhs}}
}

function fromGreaterThanFilter(node) {
  const {type, lhs, rhs} = filterParts(node)
  if (type === 'literalComparison') {
    return lhs > rhs
  }

  if (type === 'fieldComparison') {
    return {$expr: {$gt: [`$${lhs}`, `$${rhs}`]}}
  }

  return {[lhs]: {$gt: rhs}}
}

function fromGreaterThanOrEqualFilter(node) {
  const {type, lhs, rhs} = filterParts(node)
  if (type === 'literalComparison') {
    return lhs >= rhs
  }

  if (type === 'fieldComparison') {
    return {$expr: {$gte: [`$${lhs}`, `$${rhs}`]}}
  }

  return {[lhs]: {$gte: rhs}}
}

function fromLessThanFilter(node) {
  const {type, lhs, rhs} = filterParts(node)
  if (type === 'literalComparison') {
    return lhs < rhs
  }

  if (type === 'fieldComparison') {
    return {$expr: {$lt: [`$${lhs}`, `$${rhs}`]}}
  }

  return {[lhs]: {$lt: rhs}}
}

function fromLessThanOrEqualFilter(node) {
  const {type, lhs, rhs} = filterParts(node)
  if (type === 'literalComparison') {
    return lhs <= rhs
  }

  if (type === 'fieldComparison') {
    return {$expr: {$lte: [`$${lhs}`, `$${rhs}`]}}
  }

  return {[lhs]: {$lte: rhs}}
}

function fromInFilter(node) {
  const {type, lhs, rhs} = filterParts(node)

  // 'stringVal' in fieldName
  if (!rhs.$op && !Array.isArray(rhs) && type !== 'fieldComparison') {
    return {[lhs]: rhs}
  }

  // _id in path('drafts.*')
  let op = '$in'
  let rhsValue = rhs
  if (rhs.$op && rhs.value) {
    op = rhs.$op
    rhsValue = rhs.value
  }

  // 'foo' in ['hei', 'der']
  // 'drafts.foo' in path('drafts.*')
  if (type === 'literalComparison') {
    return op === '$in' ? rhs.includes(lhs) : new RegExp(rhsValue).test(lhs)
  }

  // mainTagField in arrayOfTagsField
  if (type === 'fieldComparison') {
    return {
      [lhs]: {$exists: true},
      [rhsValue]: {$type: 'array'},
      $expr: {[op]: [`$${lhs}`, `$${rhsValue}`]}
    }
  }

  return {[lhs]: {[op]: rhsValue}}
}

function fromInPathFilter(node) {
  const [path] = node.arguments.map(fromNode)
  const pattern = escapeRegExp(path)
    .replace(/\\\*\\\*/g, '')
    .replace(/\\\*$/g, '[^\\.]+$')

  return {$op: '$regex', value: `^${pattern}`}
}

function fromDefinedFilter(node) {
  const [field] = node.arguments.map(fromNode)
  return {[field]: {$exists: true, $not: {$size: 0}}}
}

function fromReferencesFilter(node) {
  const [id] = node.arguments.map(fromNode)
  return {'@references': id}
}

function fromMatchFilter(node) {
  const {type, lhs, rhs} = filterParts(node)
  const pattern = escapeRegExp(rhs).replace(/\\*$/, '.*?')
  if (type === 'literalComparison') {
    return new RegExp(pattern, 'i').test(lhs)
  }

  return {[lhs]: {$regex: `\\b${pattern}\\b`, $options: 'i'}}
}

function fromAccessor(node) {
  return node.path.map(fromNode).join('.')
}

function fromAttribute(node) {
  return node.name
}

function fromLiteral(node) {
  switch (node.type) {
    case 'float':
    case 'string':
    case 'integer':
    case 'bool':
      return node.value
    default:
      throw new Error(`toMongo: Unhandled literal type "${node.type}"`)
  }
}

function fromArray(node) {
  return node.operations.map(fromNode)
}

function fromFunctionCall(node) {
  switch (node.name) {
    case 'path':
      return fromInPathFilter(node)
    case 'defined':
      return fromDefinedFilter(node)
    case 'references':
      return fromReferencesFilter(node)
    default:
      log(node)
      throw new Error(`toMongo: Unhandled function call "${node.name}"`)
  }
}

function fromSubscript(node) {
  return {limit: node.end - node.start, offset: node.start, returnFirst: node.first}
}

function fromSortDirection(node) {
  return [fromNode(node.expression), node.direction === 'desc' ? -1 : 1]
}

function fromOrdering(node) {
  return {sort: node.terms.map(fromNode)}
}

// eslint-disable-next-line complexity
function filterParts(node) {
  const lhsIsAccessor = isAccessor(node.lhs)
  const rhsIsAccessor = isAccessor(node.rhs)

  const lhs = node.lhs && fromNode(node.lhs)
  const rhs = node.rhs && fromNode(node.rhs)

  if (lhsIsAccessor && rhsIsAccessor) {
    // some.field == other.field
    return {type: 'fieldComparison', lhs, rhs}
  } else if (lhsIsAccessor && rhs) {
    // some.field == 'some value'
    return {type: 'fieldLiteralComparison', lhs, rhs}
  } else if (rhsIsAccessor && lhs) {
    // 'some value' == some.field (-> some.field == 'some value')
    return {type: 'fieldLiteralComparison', lhs: rhs, rhs: lhs}
  } else if (lhs && rhs) {
    // 'some value' == 'other value'
    return {type: 'literalComparison', lhs, rhs}
  }

  throw new Error('Unable to determine filter type')
}

function wrapQuery(queryVal) {
  return {query: queryVal}
}

function isAccessor(node) {
  return node ? node.op === 'accessor' : false
}

function escapeRegExp(reg) {
  // eslint-disable-next-line no-useless-escape
  return reg.replace(/([-.*+?^${}()|[\]\/\\])/g, '\\$1')
}
