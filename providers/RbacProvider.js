'use strict'

const { ServiceProvider } = require('@adonisjs/fold')

class RbacProvider extends ServiceProvider {
  register () {
    const namespace = 'Adonis/Addons/Rbac'

    this.app.bind(`${namespace}/Models/Auth`, () => {
      const Auth = require('../src/Models/Auth')
      Auth._bootIfNotBooted()
      return Auth
    })
    this.app.alias(`${namespace}/Models/Auth`, 'Rbac/Models/Auth')

    this.app.bind(`${namespace}/Models/Role`, () => {
      const Role = require('../src/Models/Role')
      Role._bootIfNotBooted()
      return Role
    })
    this.app.alias(`${namespace}/Models/Role`, 'Rbac/Models/Role')

    this.app.bind(`${namespace}/Models/Permission`, () => {
      const Permission = require('../src/Models/Permission')
      Permission._bootIfNotBooted()
      return Permission
    })
    this.app.alias(`${namespace}/Models/Permission`, 'Rbac/Models/Permission')

    this.app.bind(`${namespace}/Models/Rule`, () => {
      const Rule = require('../src/Models/Rule')
      Rule._bootIfNotBooted()
      return Rule
    })
    this.app.alias(`${namespace}/Models/Rule`, 'Rbac/Models/Rule')

    this.app.singleton(`${namespace}`, app => {
      const Rbac = require('../src/Rbac')
      const Config = this.app.use('Adonis/Src/Config')
      const Logger = this.app.use('Adonis/Src/Logger')
      return new Rbac(Logger, Config.get('rbac', {}))
    })
    this.app.alias(`${namespace}`, 'Rbac')

    this.app.bind(`${namespace}/Trails/User`, () => {
      const UserTrail = require('../src/Trails/User')
      return new UserTrail()
    })
    this.app.alias(`${namespace}/Trails/User`, 'Rbac/Trails/User')

    this.app.bind(`${namespace}/Middlewares/AccessControl`, () => {
      const AccessControlMiddleware = require('../src/Middlewares/AccessControl')
      return new AccessControlMiddleware()
    })
    this.app.alias(`${namespace}/Middlewares/AccessControl`, 'Rbac/Middlewares/AccessControl')
  }
}

module.exports = RbacProvider
