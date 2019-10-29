'use strict'

const Auth = use('Rbac/Models/Auth')

class Rule extends Auth {
  static get TYPE () { return 3 }
  constructor () {
    super()
    this.type = this.constructor.TYPE
  }
}

module.exports = Rule
