import 'babel-polyfill'

import config from 'config'
import cors from 'koa-cors'
import json from 'koa-json'
import jsonBody from 'koa-json-body'
import koa from 'koa'
import pg from 'postgres-gen'
import posts from './routes/posts'
import profiles from './routes/profiles'
import ssl from 'koa-ssl'
import users from './routes/users'
import { hasValidToken } from './middleware/auth'

const app = koa()
const pgCon = pg(config.get('pg.conStr'))

app.use(ssl())
app.use(cors({
  origin: config.get('urls.webBase'),
  credentials: true
}))

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
app.use(hasValidToken)

if (!module.parent) {
  app.listen(config.get('koa.port'))
  console.log('App listening on port ' + config.get('koa.port'))
}

export default app
