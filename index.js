import config from 'config'
import json from 'koa-json'
import jsonBody from 'koa-json-body'
import koa from 'koa'
import pg from 'postgres-gen'
import users from './routes/users'

let app = koa()

app.use(jsonBody({ limit: '10kb' }))
app.use(json())

app.use(function *(next) {
  this.pg = pg(config.get('pg.conStr'))
  yield next
})

app.use(users.routes())

app.listen(config.get('koa.port'))
console.log('App listening on port ' + config.get('koa.port'))
