'use strict'

const ForbiddenException = require('../Exceptions/Forbidden')

class AccessControl {
  async handle ({ request, auth }, next, ...args) {
    if (!auth || !auth.user) {
      throw new ForbiddenException()
    }
    const action = request.url().toLowerCase().split('/').filter(Boolean)
    const method = request.method().toUpperCase()
    do {
      const a = action.join('/')
      if (await auth.user.can(`${method} /${a}`) ||
          await auth.user.can(`/${a}`) ||
          await auth.user.can(`${method} /${a}/*`) ||
          await auth.user.can(`/${a}/*`)) {
        await next()
        return
      }
      action.pop()
    }
    while (action.length > 0)
    throw new ForbiddenException()
  }

  async wsHandle ({ request, auth }, next, ...args) {
    await next()
  }
}

module.exports = AccessControl
