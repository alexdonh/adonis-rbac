'use strict'

const { Command } = require('@adonisjs/ace')
const Rbac = use('Rbac')

class AddChild extends Command {
  static get signature () {
    return `
      rbac:add-child
      { parentId: RBAC parent ID }
      { childId: RBAC child ID }
    `
  }

  static get description () {
    return 'Add a child to a parent RBAC item'
  }

  async handle (args, options) {
    await Rbac.addChild(args.parentId, args.childId)
      .then(result => {
        this.info(result)
      })
      .catch(err => {
        this.error(err)
      })
    process.exit(0)
  }
}

module.exports = AddChild
