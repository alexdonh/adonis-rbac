'use strict'

const { Command } = require('@adonisjs/ace')
const Rbac = use('Rbac')

class Update extends Command {
  static get signature () {
    return `
      rbac:update
      { id: ID }
      { name: Name }
      { description?: Description }
    `
  }

  static get description () {
    return 'Update a RBAC item'
  }

  async handle (args, options) {
    await Rbac.update(args.id, { name: args.name, description: args.description })
      .then(result => {
        this.info(result)
      })
      .catch(err => {
        this.error(err)
      })
    process.exit(0)
  }
}

module.exports = Update
