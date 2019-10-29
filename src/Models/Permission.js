'use strict'

const Auth = use('Rbac/Models/Auth')

class Permission extends Auth {
  static get TYPE () { return 2 }
  constructor () {
    super()
    this.type = this.constructor.TYPE
  }
}

module.exports = Permission
