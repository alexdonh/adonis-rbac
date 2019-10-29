'use strict'

const { Command } = require('@adonisjs/ace')
const Rbac = use('Rbac')

class Check extends Command {
  static get signature () {
    return `
      rbac:check
      { userId: User ID }
      { authId: RBAC item ID }
    `
  }

  static get description () {
    return 'Assign a RBAC item to a user'
  }

  async handle (args, options) {
    await Rbac.checkAccess(args.userId, args.authId)
      .then(result => {
        this.info(result)
      })
      .catch(err => {
        this.error(err)
      })
    process.exit(0)
  }
}

module.exports = Check
