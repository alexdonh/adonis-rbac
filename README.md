# Adonis RBAC

Another Role-Based Access Control (RBAC) implementation for [AdonisJs](https://github.com/adonisjs/adonis-framework)

## Installation

```bash
$ adonis install git+https://github.com/alexdonh/adonis-rbac.git --as=adonis-rbac
```

## Setup

1. Register RBAC providers in `start/app.js` file.

```js
const providers = [
  ...
  '@adonisjs/lucid/providers/LucidProvider',
  'adonis-rbac/providers/RbacProvider'
]

const aceProviders = [
  ...
  '@adonisjs/lucid/providers/MigrationsProvider',
  'adonis-rbac/providers/CommandsProvider'
]
```

2. Setting up trait in `/app/Models/User.js` model.

```js
class User extends Model {

  static get traits() {
    return [
      '@provider:Rbac/Traits/User'
    ]
  }

  // or if you need to customize the properties

  static boot () {
    super.boot()

    this.addTrait('@provider:Rbac/Traits/User', {
      cache: false, // or cache component. See https://github.com/alexdonh/adonis-cache.git
      cacheKeyPrefix: 'rbac/user/',
      cacheDuration: 60 * 24,
      allowActions: []
    })
  }
}
```

3. Setting up middleware in `start/kernel.js` file.

```js
const namedMiddleware = {
  ...
  rbac: 'Rbac/Middlewares/AccessControl'
  ...
}
```

4. Run the migrations. See [https://adonisjs.com/docs/4.1/migrations](https://adonisjs.com/docs/4.1/migrations)

```bash
$ adonis migration:run
```

## Usage

1. In `start/routes.js`:

```js
Route.get('/path/to/action', 'SomeController.someAction').middleware(['auth'])

// or

Route
  .group(() => {
    ...
  })
  .middleware(['auth'])
```

2. In controller actions:

```js
if (auth.user.is('administrator')) {
  ...
}

// or

if (auth.user.can('/path/to/action')) {
  ...
}
```

## Credits

- [Alex Do](https://github.com/alexdonh)

## Support

Having trouble? [Open an issue](https://github.com/alexdonh/adonis-rbac/issues/new)!

## License

The MIT License (MIT). See [License File](LICENSE) for more information.