import config from 'config'
import cors from 'koa-cors'
import json from 'koa-json'
import jsonBody from 'koa-json-body'
import koa from 'koa'
import material from './routes/material'
import pg from 'postgres-gen'
import ssl from 'koa-ssl'

const app = koa()
const pgCon = pg(config.get('pg.conStr'))

app.use(ssl())
app.use(cors({
  origin: config.get('urls.webBase')
}))

app.use(jsonBody({ limit: '10kb' }))
app.use(json())

app.use(function *(next) {
  this.pg = pgCon
  yield next
})

app.use(material.routes())

if (!module.parent) {
  app.listen(config.get('koa.port'))
  console.log('App listening on port ' + config.get('koa.port'))
}

export default app
