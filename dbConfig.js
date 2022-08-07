require('dotenv')

const Pool = require('pg').Pool

const pool = new Pool({
    user: 'westhecoder',
    host: 'localhost',
    password: 'wisla47223',
    database: 'nodelogin',
    port: '5432'

})

module.exports = pool