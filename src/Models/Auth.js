'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Auth extends Model {
  static get table() {
    return 'auth'
  }
  
  static get incrementing () {
    return false
  }

  static get hidden () {
    return ['createdAt', 'updatedAt', 'type', 'data']
  }
}

module.exports = Auth
