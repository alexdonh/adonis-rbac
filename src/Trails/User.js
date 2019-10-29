'use strict'

const _ = require('lodash')
const { ioc } = require('@adonisjs/fold')
const Rbac = use('Rbac')

class User {
  register (Model, options = {}) {
    const defaultOptions = {
      cache: false,
      cacheKeyPrefix: 'rbac/user/',
      cacheDuration: 60 * 24,
      allowActions: []
    }
    options = _.extend({}, defaultOptions, options)

    Model.prototype.getRbacCacheKey = function () {
      return [options.cacheKeyPrefix, this.id].join('')
    }

    let cache = false
    if (_.isObject(options.cache)) {
      cache = options.cache
    } else if (_.isString(options.cache)) {
      cache = ioc.use(options.cache)
    }

    Model.prototype.can = Model.prototype.is = async function (authId, params = {}, allowCaching = true) {
      if (_.includes(options.allowedActions, '*') || _.includes(options.allowedActions, authId)) {
        return true
      }

      let access = false

      if (cache && allowCaching && _.isEmpty(params)) {
        const cached = await cache.get(this.getRbacCacheKey(), false)
        if (cached && cached[authId]) {
          return cached[authId]
        }
      }

      access = await Rbac.checkAccess(this.id, authId, params)

      if (cache && allowCaching && _.isEmpty(params)) {
        const cached = await cache.get(this.getRbacCacheKey(), {})
        cached[authId] = access
        await cache.put(this.getRbacCacheKey(), cached, options.cacheDuration)
      }

      return access
    }

    Model.prototype.roles = function () {
      return this.belongsToMany('Rbac/Models/Role', 'userId', 'authId', 'id', 'id')
        .pivotTable('user_auth')
        .pivotPrimaryKey(['userId', 'authId'])
        .withTimestamps()
        .where('auth.type', Rbac.TYPE_ROLE)
    }

    Model.prototype.permissions = function () {
      return this.belongsToMany('Rbac/Models/Permission', 'userId', 'authId', 'id', 'id')
        .pivotTable('user_auth')
        .pivotPrimaryKey(['userId', 'authId'])
        .withTimestamps()
        .where('auth.type', Rbac.TYPE_PERMISSION)
    }

    Model.scopeHasRoles = (query, roles) => {
      if (!_.isArray(roles)) {
        roles = [roles]
      }
      return query.whereHas('roles', builder => {
        builder.whereIn('auth.id', roles)
      })
    }

    Model.scopeHasPermissions = (query, permissions) => {
      if (!_.isArray(permissions)) {
        permissions = [permissions]
      }
      return query.whereHas('permissions', builder => {
        builder.whereIn('auth.id', permissions)
      })
    }

    Model.scopeDoesntHaveRoles = (query, roles) => {
      if (!_.isArray(roles)) {
        roles = [roles]
      }
      return query.whereDoesntHave('roles', builder => {
        builder.whereIN('auth.id', roles)
      })
    }

    Model.scopeDoesntHavePermissions = (query, permissions) => {
      if (!_.isArray(permissions)) {
        permissions = [permissions]
      }
      return query.whereDoesntHave('permissions', builder => {
        builder.whereIn('auth.id', permissions)
      })
    }
  }
}

module.exports = User
