function rewriteAttribute(node, attribute, cb) {
  if (!node[attribute]) {
    return node
  }
  const next = rewrite(node[attribute], cb)
  if (next !== node[attribute]) {
    return Object.assign({}, node, {
      [attribute]: next
    })
  }
  return node
}


export default function rewrite(node, cb) {
  if (!node) {
    return null
  }
  const kind = node.node
  if (Array.isArray(node)) {
    return node.map(item => rewrite(item, cb))
  }

  ['lhs', 'rhs', 'filter', 'operations', 'terms'].reduce(
    (node, attribute) => rewriteAttribute(node, attribute, cb),
    node
  )

  return cb(node)
}
