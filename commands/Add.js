'use strict'

const { Command } = require('@adonisjs/ace')
const Rbac = use('Rbac')

class Add extends Command {
  static get signature () {
    return `
      rbac:add
      { type: Type }
      { id: ID }
      { name: Name }
      { description?: Description }
    `
  }

  static get description () {
    return 'Add a RBAC item'
  }

  async handle (args, options) {
    await Rbac.add({ ...args })
      .then(result => {
        this.info(result)
      })
      .catch(err => {
        this.error(err)
      })
    process.exit(0)
  }
}

module.exports = Add
