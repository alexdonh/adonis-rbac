'use strict'

const { Command } = require('@adonisjs/ace')
const Rbac = use('Rbac')

class Assign extends Command {
  static get signature () {
    return `
      rbac:assign
      { userId: User ID }
      { authId: RBAC item ID }
    `
  }

  static get description () {
    return 'Assign a RBAC item to a user'
  }

  async handle (args, options) {
    await Rbac.assign(args.authId, args.userId)
      .then(result => {
        this.info(result)
      })
      .catch(err => {
        this.error(err)
      })
    process.exit(0)
  }
}

module.exports = Assign
