'use strict'

const path = require('path')

module.exports = async (cli) => {
  try {
    cli.command.info('Creating config file...')
    await cli.copy(path.join(__dirname, 'templates/config.mustache'), path.join(cli.helpers.configPath(), 'rbac.js'))
    cli.command.completed('create', 'config/rbac.js')
  } catch (err) {
    cli.command.info('config/rbac.js already exists.')
  }

  const migrationFile = `${new Date().getTime()}_auth_schema.js`
  try {
    cli.command.info('Creating migration file...')
    await cli.copy(path.join(__dirname, 'templates/schema.mustache'), path.join(cli.helpers.migrationsPath(), migrationFile))
    cli.command.completed('create', `database/migrations/${migrationFile}`)
  } catch (err) {
    cli.command.info(`database/migrations/${migrationFile} already exists.`)
  }
}
