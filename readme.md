# Simple ORM for working with DB on Cloudflare
db - an instance of Cloudflare D1
tables - your tables in format key: value ie:


# Usage:
## To create an instance of Simple ORM first make sure you defined table and its columns:
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
        data: 'JSON',
        createdAt: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
        updatedAt: 'DATETIME DEFAULT CURRENT_TIMESTAMP'
        roleID: 'text'
    },
    roles: {
        id: 'TEXT PRIMARY KEY',
        name: 'text',
        orgID: 'text',
        systemName: 'text'
    },
    // Other tables
}
```

## Pass DB instance of Cloudflare to the class

```js
const simpleORM = new SimpleORM(env.DB, tables)
```


# Examples

##  Get active users

```js
const options = {
    where: [
        ['status', '=', 'active']
    ]    
}
cosnt activeUsers = await simpleORM.findAll("users", options)
```

## Searching by column name
```js
const options = {
    where: [
        ['status', '=', 'active'],
        ['email', 'LIKE', 'serik']
    ]    
}
cosnt result = await simpleORM.findAll("users", options)
```

## Get new users
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

## Get only first 100 users
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

## Also you can join with other tables
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
