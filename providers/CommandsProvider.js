'use strict'

const { ServiceProvider } = require('@adonisjs/fold')

class CommandsProvider extends ServiceProvider {
  register () {
    this.app.bind('App/Commands/Rbac:Add', () => require('../commands/Add'))
    this.app.bind('App/Commands/Rbac:AddChild', () => require('../commands/AddChild'))
    this.app.bind('App/Commands/Rbac:Assign', () => require('../commands/Assign'))
    this.app.bind('App/Commands/Rbac:Check', () => require('../commands/Check'))
    this.app.bind('App/Commands/Rbac:Delete', () => require('../commands/Delete'))
    this.app.bind('App/Commands/Rbac:Revoke', () => require('../commands/Revoke'))
    this.app.bind('App/Commands/Rbac:Update', () => require('../commands/Update'))
  }

  boot () {
    const ace = require('@adonisjs/ace')
    ace.addCommand('App/Commands/Rbac:Add')
    ace.addCommand('App/Commands/Rbac:AddChild')
    ace.addCommand('App/Commands/Rbac:Assign')
    ace.addCommand('App/Commands/Rbac:Check')
    ace.addCommand('App/Commands/Rbac:Delete')
    ace.addCommand('App/Commands/Rbac:Revoke')
    ace.addCommand('App/Commands/Rbac:Update')
  }
}

module.exports = CommandsProvider
