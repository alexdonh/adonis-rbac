'use strict'

const { Command } = require('@adonisjs/ace')
const Rbac = use('Rbac')

class Delete extends Command {
  static get signature () {
    return `
      rbac:delete
      { id: ID }
    `
  }

  static get description () {
    return 'Delete a RBAC item'
  }

  async handle (args, options) {
    await Rbac.delete(args.id)
      .then(result => {
        this.info(result)
      })
      .catch(err => {
        this.error(err)
      })
    process.exit(0)
  }
}

module.exports = Delete
