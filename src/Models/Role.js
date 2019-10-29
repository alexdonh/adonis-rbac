'use strict'

const Auth = use('Rbac/Models/Auth')

class Role extends Auth {
  static get TYPE () { return 1 }
  constructor () {
    super()
    this.type = this.constructor.TYPE
  }
}

module.exports = Role
