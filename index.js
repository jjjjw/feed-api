'use strict'

const config = require('config')
const koa = require('koa')
const koaPg = require('koa-pg')

let app = koa()
app.use(koaPg(config.get('pg.conStr')))
app.listen(config.get('koa.port'))
console.log('App listening on port ' + config.get('koa.port'))
