'use strict'

const _ = require('lodash')
const { ioc } = require('@adonisjs/fold')
const GE = require('@adonisjs/generic-exceptions')
const Role = require('../Models/Role')
const Permission = require('../Models/Permission')
const Rule = require('../Models/Rule')

const Database = use('Database')

class Rbac {
  constructor (Logger, config) {
    const defaults = {
      cache: false,
      cacheKey: 'rbac',
      cacheDuration: 60 * 24
    }
    config = _.extend(defaults, config)

    this.logger = Logger

    this.cache = false
    if (_.isObject(config.cache)) {
      this.cache = config.cache
    } else if (_.isString(config.cache)) {
      this.cache = ioc.use(config.cache)
    }

    this.cacheKey = config.cacheKey
    this.cacheDuration = config.cacheDuration

    this.items = {}
    this.parents = {}
    this._checkAccessAssignments = {}
    this._defaultRoles = []
  }

  get defaultRoles () {
    return this._defaultRoles
  }

  set defaultRoles (roles) {
    if (!roles) {
      return
    }
    if (_.isArray(roles)) {
      this._defaultRoles = roles
    } else if (_.isFunction(roles)) {
      roles = roles.call(this)
      if (!_.isArray(this._defaultRoles)) {
        throw GE.InvalidArgumentException.invoke('Default roles callable must return an array')
      }
      this._defaultRoles = roles
    } else {
      throw GE.InvalidArgumentException.invoke('Default roles must be either an array or a callable')
    }
  }

  async checkAccess (userId, authId, params = {}) {
    let assignments = null
    if (_.has(this._checkAccessAssignments, userId)) {
      assignments = this._checkAccessAssignments[userId]
    } else {
      assignments = await this.getAssignments(userId)
      this._checkAccessAssignments[userId] = assignments
    }

    if (this.hasNoAssignments(assignments)) {
      return false
    }

    await this.loadFromCache()

    if (this.items && _.keys(this.items).length > 0) {
      return this._checkAccessFromCache(userId, authId, params, assignments)
    }

    return this._checkAccessRecursive(userId, authId, params, assignments)
  }

  async _checkAccessFromCache (userId, authId, params, assignments) {
    if (!_.has(this.items, authId)) {
      return false
    }

    const item = this.items[authId]

    if (!await this._executeRule(userId, item, params)) {
      return false
    }

    if (_.has(assignments, authId) || _.includes(this.defaultRoles, authId)) {
      return true
    }

    if (_.has(this.parents, authId)) {
      for (let i = 0; i < this.parents[authId].length; ++i) {
        if (await this._checkAccessFromCache(userId, this.parents[authId][i], params, assignments)) {
          return true
        }
      }
    }

    return false
  }

  async _checkAccessRecursive (userId, authId, params, assignments) {
    const item = await this._getItem(authId)
    if (!item) {
      return false
    }

    if (!await this._executeRule(userId, item, params)) {
      return false
    }

    if (_.has(assignments, authId) || _.includes(this.defaultRoles, authId)) {
      return true
    }

    const parents = await Database.select('parentId').from('auth_child').where({ childId: authId }).pluck('parentId')
    for (let i = 0; i < parents.length; ++i) {
      if (await this._checkAccessRecursive(userId, parents[i], params, assignments)) {
        return true
      }
    }
  }

  async _executeRule (userId, item, params) {
    // TODO implement rule check
    return true
  }

  async add (auth) {
    return Database.insert({ ...auth }).into('auth').returning('*')
  }

  async update (id, auth) {
    return Database.table('auth').where({ id }).update({ ...auth })
  }

  async delete (auth) {
    const id = _.isObject(auth) ? auth.id : auth
    return Database.table('auth').where({ id }).delete()
  }

  async getRoles () {
    return this._getItems(Role.TYPE)
  }

  async getRole (roleId) {
    return Database.select('*').from('auth').where({ id: roleId, type: Role.TYPE }).first()
  }

  async getRolesByUser (userId) {
    return Database.select('auth.*').from('user_auth')
      .leftJoin('auth', function () {
        this
          .on('auth.id', 'user_auth.authId')
          .andOn('user_auth.userId', Database.raw(userId))
          .andOn('auth.type', Database.raw(Role.TYPE))
      })
  }

  async getChildRoles (roleId) {
    const role = await this.getRole(roleId)
    if (!role) {
      throw GE.RuntimeException.invoke(`Role "${roleId}" not found`)
    }

    const result = []
    this._getChildrenRecursive(roleId, await this._getChildrenList(), result)

    const roles = { [roleId]: role }
    _.each(await this.getRoles(), function (value) {
      if (_.includes(result, value.id)) {
        roles[value.id] = value
      }
    })

    return roles
  }

  async getPermissions () {
    return this._getItems(Permission.TYPE)
  }

  async getPermission (permissionId) {
    return Database.select('*').from('auth').where({ id: permissionId, type: Permission.TYPE }).first()
  }

  async getPermissionsByRole (roleId) {
    const result = []
    this._getChildrenRecursive(roleId, await this._getChildrenList(), result)
    if (result.length === 0) {
      return {}
    }

    const permissions = await Database.select('*').from('auth')
      .whereIn('id', result)
      .andWhere({ type: Permission.TYPE })

    return _.keyBy(permissions, 'id')
  }

  async getPermissionsByUser (userId) {
    if (!userId) {
      return {}
    }

    return _.merge(
      await this.getDirectPermissionsByUser(userId),
      await this.getInheritedPermissionsByUser(userId)
    )
  }

  async getRules () {
    return this._getItems(Rule.TYPE)
  }

  async getRule (ruleId) {
    return Database.select('*').from('auth').where({ id: ruleId, type: Rule.TYPE }).first()
  }

  async canAddChild (parent, child) {
    return !await this.detectLoop(parent, child)
  }

  async addChild (parent, child) {
    if (parent.id === child.id) {
      throw GE.RuntimeException.invoke(`Cannot add '${parent.id}' as a child of itself.`)
    }

    if (parent.type === Permission.TYPE && child.type === Role.TYPE) {
      throw GE.RuntimeException.invoke('Cannot add a role as a child of a permission.')
    }

    if (this.detectLoop(parent, child)) {
      throw GE.RuntimeException.invoke(`Cannot add '${child.id}' as a child of '${parent.id}'. A loop has been detected.`)
    }

    return Database.insert({ parentId: parent.id, childId: child.id }).into('auth_child').returning('*')
  }

  async removeChild (parent, child) {
    return Database.table('auth_child').where({ parentId: parent.id, childId: child.id }).delete()
  }

  async removeChildren (parent) {
    return Database.table('auth_child').query().where('parentId', parent.id).delete()
  }

  async hasChild (parent, child) {
    const c = await Database.table('auth_child').where({ parentId: parent.id, childId: child.id }).count(Database.raw('1')).first()
    return c.count > 0
  }

  async getChildren (parentId) {
    return Database.select('auth.*').from('auth')
      .innerJoin('auth_child', function () {
        this
          .on('auth.id', 'auth_child.childId')
          .andOn('auth_child.parentId', Database.raw(parentId))
      })
  }

  async assign (authId, userId) {
    const c = await Database.table('user_auth').where({ userId, authId }).count(Database.raw('1')).first()
    if (c.count > 0) {
      return false
    }
    delete this._checkAccessAssignments[userId]
    return Database.insert({ userId, authId }).into('user_auth').returning('*')
  }

  async revoke (authId, userId) {
    if (!userId) {
      return false
    }
    delete this._checkAccessAssignments[userId]
    return Database.table('user_auth').where({ userId, authId }).delete()
  }

  async revokeAll (userId) {
    if (!userId) {
      return false
    }
    delete this._checkAccessAssignments[userId]
    return Database.table('user_auth').where({ userId: userId }).delete()
  }

  async getAssignment (authId, userId) {
    if (!userId) {
      return null
    }
    return Database.select('*').from('user_auth').where({ userId: userId, authId: authId }).first()
  }

  async getAssignments (userId) {
    if (!userId) {
      return {}
    }
    const results = await Database.select('*').from('user_auth').where({ userId: userId })
    return _.keyBy(results, 'authId')
  }

  async getUserIdsByRole (roleId) {
    if (!roleId) {
      return []
    }
    return Database.select('userId').from('user_auth')
      .where({ authId: roleId })
      .pluck('userId')
  }

  async removeAll () {
    this.removeAllAssignments()
    await Database.table('auth').query().delete()
    await Database.table('auth_child').delete()
    await Database.table('user_auth').delete()
    await this.invalidateCache()
  }

  async removeAllPermissions () {
    await this._removeAllItems(Permission.TYPE)
  }

  async removeAllRoles () {
    await this._removeAllItems(Role.TYPE)
  }

  async removeAllRules () {
    await this._removeAllItems(Rule.TYPE)
  }

  async removeAllAssignments () {
    this._checkAccessAssignments = {}
    await Database.table('user_auth').delete()
  }

  async _removeAllItems (type) {
    await Database.table('auth').where({ type }).delete()
  }

  async detectLoop (parent, child) {
    if (child.id === parent.id) {
      return true
    }

    const children = await this.getChildren(child.id)
    const keys = _.keys(children)

    for (let i = 0; i < keys.length; i++) {
      if (await this.detectLoop(parent, children[keys[i]])) {
        return true
      }
    }

    return false
  }

  async _getItems (type) {
    const results = await Database.select('*').from('auth').where({ type })
    return _.keyBy(results, 'id')
  }

  async _getItem (id) {
    return Database.select('*').from('auth').where({ id }).first()
  }

  async _getChildrenList () {
    const parents = {}
    const result = await Database.select('*').from('auth_child')
    _.forEach(result, function (value) {
      if (!_.has(parents, value.parentId)) {
        parents[value.parentId] = []
      }
      parents[value.parentId].push(value.childId)
    })
    return parents
  }

  _getChildrenRecursive (name, childrenList, result) {
    if (_.has(childrenList, name)) {
      _.each(childrenList[name], (value) => {
        result.push(value)
        this._getChildrenRecursive(value, childrenList, result)
      })
    }
  }

  async _getDirectPermissionsByUser (userId) {
    const permissions = await Database.select('*').from('auth')
      .leftJoin('user_auth', function () {
        this
          .on('auth.id', 'user_auth.authId')
          .andOn('user_auth.userId', userId)
          .andOn('auth.type', Database.raw(Permission.TYPE))
      })
    return _.keyBy(permissions, 'id')
  }

  async _getInheritedPermissionsByUser (userId) {
    const roles = await Database.select('*').from('auth')
      .leftJoin('user_auth', function () {
        this
          .on('auth.id', 'user_auth.authId')
          .andOn('user_auth.userId', userId)
          .andOn('auth.type', Database.raw(Role.TYPE))
      })
    const childrenList = await this._getChildrenList()
    const result = []
    _.each(roles, (role) => {
      this._getChildrenRecursive(role.id, childrenList, result)
    })

    if (result.length === 0) {
      return {}
    }

    const permissions = await Database.select('*').from('auth')
      .whereIn('id', result)
      .andWhere({ type: Permission.TYPE })

    return _.keyBy(permissions, 'id')
  }

  async invalidateCache () {
    if (this.cache) {
      await this.cache.delete(this.cacheKey)
      this.items = {}
      this.parents = {}
    }
    this._checkAccessAssignments = {}
  }

  async loadFromCache () {
    if ((this.items && _.keys(this.items).length > 0) || !this.cache) {
      return
    }

    const data = await this.cache.get(this.cacheKey)

    if (_.isArray(data) && data.length === 2 && data[0] && data[1]) {
      this.items = data[0]
      this.parents = data[1]
      return
    }

    const items = await Database.select('*').from('auth')
    this.items = _.keyBy(items, 'id')

    const authchilds = await Database.select('*').from('auth_child')
    this.parents = {}
    for (let i = 0; i < authchilds.length; ++i) {
      if (!_.has(this.parents, authchilds[i].childId)) {
        this.parents[authchilds[i].childId] = []
      }
      this.parents[authchilds[i].childId].push(authchilds[i].parentId)
    }

    this.cache.set(this.cacheKey, [this.items, this.parents], this.cacheDuration)
  }

  hasNoAssignments (assignments) {
    return _.isEmpty(assignments) && _.isEmpty(this.defaultRoles)
  }
}

module.exports = Rbac
