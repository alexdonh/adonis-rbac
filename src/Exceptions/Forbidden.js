'use strict'

const NE = require('node-exceptions')

class ForbiddenException extends NE.HttpException {
  static get defaultMessage () {
    return 'You are not allowed to access this page'
  }

  constructor (message) {
    super(message || ForbiddenException.defaultMessage, 403)
  }

  static invoke (message) {
    return new this(message)
  }
}

module.exports = ForbiddenException
