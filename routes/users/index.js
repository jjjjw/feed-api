import bcrypt from 'bcrypt'
import config from 'config'
import createRouter from 'koa-router'
import jwt from 'jsonwebtoken'
import jwtMiddleWare from 'koa-jwt'
import thunkify from 'thunkify'

const bcryptCompare = thunkify(bcrypt.compare)
const bcryptHash = thunkify(bcrypt.hash)
const router = createRouter({ prefix: '/users' })
const secretKey = config.get('jwt.secret')

function createToken (payload, opts) {
  return done => {
    jwt.sign(payload, secretKey, opts, token => {
      done(null, token)
    })
  }
}

router.post('/', function *(next) {
  let { email, password } = this.request.body

  // TODO: validate

  let hash = yield bcryptHash(password, 10)

  let user = yield this.pg.queryOne(`INSERT INTO users (email, password) VALUES ('${email}', '${hash}') RETURNING id;`)

  let token = yield createToken({ role: 'user', id: user.id })
  this.status = 201
  this.response.body = { token }
})

router.post('/login', function *(next) {
  let { email, password } = this.request.body

  // TODO: validate

  let user = yield this.pg.queryOne(`SELECT password, id FROM users WHERE email = '${email}';`)

  // TODO: handle no user

  let validPw = yield bcryptCompare(password, user.password)

  if (validPw) {
    let token = yield createToken({ role: 'user', id: user.id })
    this.status = 201
    this.response.body = { token }
  } else {
    this.status = 401
  }
})

router.get('/profiles', jwtMiddleWare({ secret: config.get('jwt.secret') }), function *(next) {
  let id = this.state.user.id

  let profiles = (yield this.pg.query(`SELECT name, id FROM profiles WHERE user_id = ${id};`)).rows

  this.response.body = {
    profiles
  }
})

export default router
