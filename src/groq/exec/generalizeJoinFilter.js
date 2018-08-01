/* eslint-disable require-await */

import rewrite from '../plan/rewrite'
import debug from '../debug'

export default async function generalizeJoinFilter(node, scope) {
  debug('generalizeJoinFilter()', node, scope)
  return rewrite(node, operation => {
    switch (operation.op) {
      case 'eq':
        return generalizeEQ(operation, scope)
      default:
        return operation
    }
  })
}

async function generalizeEQ(operation, scope) {
  const lhsIsJoin = isJoinAccessor(operation.lhs)
  const rhsIsJoin = isJoinAccessor(operation.rhs)
  if (!lhsIsJoin && !rhsIsJoin) {
    debug("generalizeJoinFilter() (is not a join)")
    // Not part of the join
    return operation
  }

  if (lhsIsJoin && rhsIsJoin) {
    throw new Error(`In a join, only the lhs or rhs can reference parent`)
  }
  let join
  let constant
  if (lhsIsJoin) {
    join = operation.lhs
    constant = operation.rhs
  } else {
    join = operation.rhs
    constant = operation.lhs
  }
  const joinScopes = await scope.child({
    value: {}
  }).resolveAccessorForAll(join.path)

  if (joinScopes.length == 0) {
    return {
      op: 'literal',
      value: false
    }
  }
  if (joinScopes.length == 1) {
    return {
      op: 'eq',
      lhs: constant,
      rhs: {
        op: 'literal',
        value: joinScopes[0].value
      }
    }
  }
  return {
    op: 'in',
    lhs: constant,
    rhs: {
      op: 'literal',
      value: joinScopes.map(item => item.value)
    }
  }
}

function isJoinAccessor(operation) {
  if (operation.op != 'accessor') {
    return false
  }

  if (operation.path.length == 0) {
    return false
  }

  if (operation.path[0].op == 'parent') {
    return true
  }

  return false
}