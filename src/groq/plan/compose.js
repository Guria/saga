const ops = require('./operations')

function compose(node) {
  const kind = node.node
  switch (kind) {
    case 'pipeOperator':
      return nodePipeOperator(node)
    case 'dotOperator':
      return nodeDotOperator(node)
    case 'everything':
      return nodeEverything(node)
    case 'constraint':
      return nodeConstraint(node)
    case 'binaryOperator':
      return nodeBinaryOperator(node)
    case 'attribute':
      return nodeAttribute(node)
    case 'integer':
    case 'string':
    case 'float':
    case 'bool':
      return nodeLiteral(node)
    default:
      throw `Unknown node type ${kind}`
  }
}

function nodePipeOperator(node) {
  const lhs = compose(node.lhs)
  const rhs = compose(node.rhs)
  return ops.applyOperator(lhs, rhs, 'pipe')
}

function nodeDotOperator(node) {
  const lhs = compose(node.lhs)
  const rhs = compose(node.rhs)
  return ops.applyOperator(lhs, rhs, 'dot')
}

function nodeEverything(node) {
  return ops.everything
}

function nodeConstraint(node) {
  const filter = compose(node.expression)
  return new ops.Filter({filter})
}

function nodeBinaryOperator(node) {
  const lhs = compose(node.lhs)
  const rhs = compose(node.rhs)
  return ops.applyOperator(lhs, rhs, node.operator)
}

function nodeAttribute(node) {
  return new ops.Accessor([
    new ops.Attribute(node.path)
  ])
}

function nodeLiteral(node) {
  return new ops.Literal({
    type: node.node,
    value: node.value
  })
}

module.exports = compose
