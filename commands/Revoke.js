'use strict'

const { Command } = require('@adonisjs/ace')
const Rbac = use('Rbac')

class Revoke extends Command {
  static get signature () {
    return `
      rbac:revoke
      { userId: User ID }
      { authId?: RBAC item ID }
      { --all: Revoke all RBAC items }
    `
  }

  static get description () {
    return 'Revoke a RBAC item from a user. To revoke all items, add flag --all.'
  }

  async handle (args, options) {
    if (args.authId) {
      await Rbac.revoke(args.authId, args.userId)
        .then(result => {
          this.info(result)
        })
        .catch(err => {
          this.error(err)
        })
    } else if (options.all) {
      await Rbac.revokeAll(args.userId)
        .then(result => {
          this.info(result)
        })
        .catch(err => {
          this.error(err)
        })
    } else {
      this.error('RBAC item is required')
    }
    process.exit(0)
  }
}

module.exports = Revoke
