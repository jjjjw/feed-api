import 'babel-polyfill'

import config from 'config'
import json from 'koa-json'
import jsonBody from 'koa-json-body'
import jwt from 'koa-jwt'
import koa from 'koa'
import pg from 'postgres-gen'
import profiles from './routes/profiles'
import users from './routes/users'
import posts from './routes/posts'

const app = koa()
const pgCon = pg(config.get('pg.conStr'))

app.use(jsonBody({ limit: '10kb' }))
app.use(json())

app.use(function *(next) {
  this.pg = pgCon
  yield next
})

// Unprotected middleware
app.use(posts.routes())
app.use(profiles.routes())
app.use(users.routes())

// Middleware below this line is only reached if JWT token is valid
app.use(jwt({ secret: config.get('jwt.secret') }))


if (!module.parent) {
  app.listen(config.get('koa.port'))
  console.log('App listening on port ' + config.get('koa.port'))
}

export default app
