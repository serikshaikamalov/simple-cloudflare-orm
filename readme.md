# Simple ORM / Query Builder for [Cloudflare D1](https://developers.cloudflare.com/d1/).

```bash
npm i simple-cloudflare-orm
```

# Features

- [x] Finding records by query
- [x] Getting record by it's ID
- [x] Creating a new record
- [x] Updating a record
- [x] Deleting a single record
- [x] Binding with other related tables
- [x] Selecting specific columns
- [x] Getting the number of records
- [x] Searching for a specified pattern in a column
- [x] Tranforming plain result to nested object
- [x] Searching in nested json data
- [ ] Case insensitive searching
- [ ] Supporting OR/NOT operation
- [ ] Bulk creating records
- [ ] Prepare a demo for testing

# Usage
Before starting make sure you have D1 Cloudflare database and defined tables with their column definitions

```js
const tables = {
    users: {
        id: 'text primary key',
        name: 'text',
        email: 'text',
        password: 'text',
        status: 'text',
        phone: 'text',
        birthdate: 'text',
        address: 'text',
        photo: 'text',
        comment: 'text',
        IDCard: 'json',
        passport: 'json',
        data: 'json',
        createdAt: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
        updatedAt: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
        roleID: 'text'
    },
    roles: {
        id: 'text primary key',
        name: 'text',
        orgID: 'text',
        systemName: 'text'
    },
    // Other table definitions
}
```

## Pass DB instance of Cloudflare to the class

```js
const simpleORM = new SimpleORM(env.DB, tables)
```


## Examples

###  Get active users

```js
const options = {
    where: [
        ['status', '=', 'active']
    ]    
}
cosnt activeUsers = await simpleORM.findAll("users", options)
```

### Searching by column name
```js
const options = {
    where: [
        ['status', '=', 'active'],
        ['email', 'LIKE', 'serik']
    ]    
}
cosnt result = await simpleORM.findAll("users", options)
```

### Get new users
```js
const options = {
    where: [
        ['status', '=', 'active'],        
    ],
    orderBy: {
        createdAt: 'DESC'
    },
}
cosnt newUsers = await simpleORM.findAll("users", options)
```

### Get only first 100 users
```js
const options = {
    where: [
        ['status', '=', 'active'],        
    ],
    orderBy: {
        createdAt: 'DESC'
    },
    limit: 100
}
cosnt limitedUsers = await simpleORM.findAll("users", options)
```

### Also you can join with other tables
```js
const options = {
     include: [
        ['roles', 'roles.id', 'users.roleID'],        
      ],
    where: [
        ['users.status', '=', 'active'],        
    ],
    orderBy: {
        createdAt: 'DESC'
    },
    limit: 100
}
cosnt users = await simpleORM.findAll("users", options)
```

The response is:

```js
[
    {
        "id": "serik",
        "email": "serik.shaikamalov@gmail.com",                
        "status": "active",
        "phone": 77772001991,
        "photo": "http://localhost:8788/storage/users/serik/3DBZ7G4YdTCL4UQtx5fnM-square_1200-2.jpg",
        "roles": {
            "id": "admin",
            "name": "admin",                   
        },               
        "createdAt": 1726353128482,
        "updatedAt": 1726353128482
    }
]

```



## Inserting data

```js
    const input = {
        name: 'Berik Shaikamalov',
        phone: 77075757091,
        status: "active"
    }
    const newUser = await simpleORM.create('users', input)
```


## Updating data
To update data pass id and data itself
```js
    const input = {
        id: 1,
        name: 'Berik Shaikamalov',
        phone: 77075757091,
        status: "active"
    }
    const updatedUser = await simpleORM.update('users', input.id, input)
```


## Deleting data
To delete user just pass his identifier
```js
await simpleORM.delete('users', input.id)
```

or delete all records of given table

```js
await simpleORM.deleteAll('users')
```




  
