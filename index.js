import { nanoid } from "nanoid";

/**
@description
Simple ORM for working with DB on Cloudflare
db - an intances of DB in Cloudflare
tables - your tables in format key: value ie:
 */
export class SimpleORM {
    constructor(db, tables) {
        // Cloudflare context
        this.db = db
        this.tables = tables
    }

    prepare(s) {
        return this.db.prepare(s)
    }
    async getByID(tableName, id) {
        const response = await this.db.prepare(`SELECT * FROM ${tableName} WHERE id=?`).bind(id).first()
        return convertToNestedJSON(response)
    }
    async create(tableName, entity) {
        if (!tableName) {
            throw new Error('Please provide name of table')
        }
        if (!entity.id) {
            entity.id = nanoid();
        }

        const columns = Object.entries(entity)
            .reduce((acc, curr) => {
                return [...acc, curr[0]];
            }, [])
            .join(", ");

        const values = Object.entries(entity).reduce((acc, curr) => {
            return [...acc, curr[1]];
        }, []);
        console.log("values:", values);

        const questionMarks = Array(Object.entries(entity).length).fill("?").join(", ");

        const finalQuery = `INSERT INTO ${tableName} (${columns}) VALUES (${questionMarks})`;
        console.log("finalQuery: ", finalQuery);

        await this.db.prepare(finalQuery)
            .bind(...values)
            .run();

        return entity
    }
    async update(tableName, id, entity) {
        if (!tableName) {
            throw new Error('Please provide name of table')
        }
        entity.updatedAt = new Date().getTime()

        const columns = Object.entries(entity).reduce((acc, curr) => {
            return [...acc, `${[curr[0]]}=?`]
        }, []).join(', ')

        const values = Object.entries(entity).reduce((acc, curr) => {
            return [...acc, curr[1]];
        }, []);

        const finalQuery = `UPDATE ${tableName} SET ${columns} WHERE id='${id}'`;
        console.log("finalQuery: ", finalQuery);

        await this.db.prepare(finalQuery)
            .bind(...values)
            .run();

        return entity
    }
    async delete(tableName, id) {
        return await this.db.prepare(`DELETE FROM ${tableName} WHERE id=?`)
            .bind(id)
            .run()
    }
    async deleteAll(tableName) {
        return await this.db.prepare(`DELETE FROM ${tableName}`)
            .run()
    }
    async count(tableName, orgID) {
        const { totals } = await this.db.prepare(`SELECT COUNT(*) as totals FROM ${tableName} WHERE orgID=?`).bind(orgID).first()
        return totals
    }
    async findAll(tableName, options = {}) {
        console.log("tableName:", { tableName, options: JSON.stringify(options) });
        const columns = this.tables[tableName]

        let attributes = []
        let whereQuery = ""
        let orderBy = ""
        let limit = ""
        let joins = []

        if (options) {
            if (options.attributes && options.attributes.length > 0) {
                attributes.push(options.attributes.map(c => `${tableName}.${c}`).join(', '))
            } else {
                // Select all table's columns
                attributes.push(Object.keys(columns).map(c => `${tableName}.${c}`).join(', '))
            }
            if (options.include) {
                options.include.forEach(include => {
                    const joinTable = include[0]
                    const column1 = include[1]
                    const column2 = include[2]
                    const joinQuery = `LEFT JOIN ${joinTable} as ${joinTable} ON ${column1}=${column2}`
                    joins.push(joinQuery)

                    const joinTableColumns = this.tables[joinTable]
                    const joinAttributes = Object.keys(joinTableColumns).map(c => `${joinTable}.${c} AS "${joinTable}.${c}"`).join(', ')
                    attributes.push(joinAttributes)
                });
            }
            if (options.where && options.where.length > 0) {
                let where = []
                options.where.forEach(w => {
                    if (w.length === 2) {
                        // Advanced mode
                        // Logical combinations. The Op.and, Op.or, and Op.not operators can be used to combine multiple conditions.
                        // let combinationType = w[0]
                        // TODO: Figure out how to deal with other logication combination opearions
                    } else {
                        // Simple mode
                        let result = this.buildWhereQuery(tableName, w)
                        where.push(result)
                    }
                });

                where = where.join(' AND ')
                whereQuery = `WHERE ${where}`
            }
            if (options.orderBy) {
                orderBy = Object.entries(options.orderBy).reduce((acc, [column, direction]) => `ORDER BY ${tableName}.${column} ${direction}`, ``)
            }
            if (options.limit > 0) {
                limit = `LIMIT ${options.limit}`
            }
        }

        attributes = attributes.join(', ')
        joins = joins.join('\n')

        const query = String(`SELECT ${attributes} FROM ${tableName}
            ${joins} 
            ${whereQuery}
            ${orderBy} 
            ${limit}`).replace(/\s+/g, ' ').trim();

        console.log("query:", query);
        let { results } = await this.db.prepare(query).all();
        return convertToNestedJSON(results)
    }

    /**
     * Converts to where clause
     * 
     * 1) ['orgID', '=', 'demo'] => "tableName.orgID='demo'"
     * 2) ['orgID', 'LIKE', 'demo'] => "tableName.orgID LIKE '%demo%'"
     * Also search in JSON
     * 3) ['users.IDCard.iin', 'LIKE', '91']  => json_extract(users.IDCard, '$.iin') LIKE '%91%'
     */
    buildWhereQuery(tableName, w) {
        let column = w[0]
        let operaion = w[1]
        let value = w[2]

        if (String(column).split('.').length === 3) {
            // Searchin in JSON
            const [t, jColumn, c] = String(column).split('.')
            console.log("columnL", [t, jColumn, c]);
            const columns = this.tables[t]
            const jsonColumn = columns[jColumn]

            if (jsonColumn === "json") {
                column = `json_extract(${t}.${jColumn}, '$.${c}')`
            }
        } else if (String(column).split('.').length === 0) {
            column = `${tableName}.${column}`
        }

        if (operaion === "LIKE") {
            operaion = " LIKE "
            value = `%${value}%`
        }

        let whereQuery = `${column}${operaion}${value}`

        if (typeof value === "string") {
            whereQuery = `${column}${operaion}"${value}"`
        }
        return whereQuery
    }
}

/**    
 *  Converts plain object into nested Object: IE:
    data.phone: "87014073428"
    data.language: "English"
    email:"serik.shaikamalov@gmail.com"
    name: "Serik Shaikamalov"
    to =>
    data {
        phone: "87014073428",
        language: "English"
    },
    email: "serik.shaikamalov@gmail.com",
    name: "Serik Shaikamalov"
 */
export const convertToNestedJSON = (input) => {
    if (!input)
        throw new Error('Please provide input data')

    if (Array.isArray(input)) {
        return input.map(i => convertToNestedJSON(i))
    }

    if (typeof input !== "object")
        throw new Error('Input is not object')
    return Object.entries(input).reduce((acc, [key, value]) => {
        if (!value) return acc
        if (key.includes('.')) {
            let properties = key.split('.')
            return Object.assign(acc, {
                [properties[0]]: acc[properties[0]] ?
                    Object.assign({}, acc[properties[0]], { [properties[1]]: doParse(value) }) :
                    Object.assign({}, { [properties[1]]: value })
            })
        }
        acc[key] = value
        return acc
    }, {})
}
export function doParse(v) {
    try {
        return v = JSON.parse(v)
    } catch (ex) {
        return v
    }
}