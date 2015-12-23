import config from 'config'
import jwt from 'koa-jwt'

export const hasValidToken = jwt({
  cookie: config.get('jwt.cookie'),
  secret: config.get('jwt.secret')
})
