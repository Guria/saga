/* eslint-disable require-await, max-depth */

import rewrite from '../plan/asyncRewrite'
import debug from '../debug'
import util from 'util'

export default async function generalizeJoinFilter(node, scope) {
  debug('generalizeJoinFilter()', util.inspect(node, {
    depth: 10
  }), scope)
  const result = await rewrite(node, operation => {
    switch (operation.op) {
      case 'eq':
        debug('generalizing!!', operation)
        return generalizeEQ(operation, scope)
      case 'functionCall': {
        debug('generalizing!!', operation)
        return generalizeFn(operation, scope)
      }
      default:
        return operation
    }
  })
  debug('generalizeJoinFilter() rewritten => ', util.inspect(result, {
    depth: 10
  }), scope)
  return result
}

async function generalizeFn(operation, scope) {
  if (operation.name == 'references') {
    const generalizedArgs = []
    for (let i = 0; i < operation.arguments.length; i++) {
      const arg = operation.arguments[i]
      if (isJoinAccessor(arg)) {
        const joinScopes = await scope.child({
          value: {}
        }).resolveAccessorForAll(arg.path)
        joinScopes.forEach(scope => {
          generalizedArgs.push({
            op: 'literal',
            value: scope.value
          })
        })
      } else {
        generalizedArgs.push(arg)
      }
      const generalizedFn = Object.assign({}, operation, {
        arguments: generalizedArgs
      })
      debug('BZOZO', util.inspect(generalizedFn, {
        depth: 10
      }))
      return generalizedFn
    }
  }
  return operation
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
    throw new Error(`In a join, only the lhs or rhs can reference parent (not both)`)
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