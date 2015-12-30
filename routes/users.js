import bcrypt from 'bcrypt'
import camelCase from 'camelcase'
import config from 'config'
import createRouter from 'koa-router'
import jwt from 'jsonwebtoken'
import thunkify from 'thunkify'
import { hasValidToken } from '../middleware/auth'

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

function *getProfiles (userId) {
  return (yield this.pg.query(`SELECT name, id FROM profiles WHERE user_id = ${userId};`)).rows
}

router.post('/', function *(next) {
  let { email, password } = this.request.body

  // TODO: validate

  let hash = yield bcryptHash(password, 10)

  let insertUser = `INSERT INTO users (email, password) VALUES ('${email}', '${hash}') RETURNING id, role;`
  let user = yield this.pg.queryOne(insertUser)

  let token = yield createToken(user)

  this.cookies.set(config.get('jwt.cookie'), token, {
    expires: new Date(new Date().setMonth(new Date().getMonth() + 1))
  })

  this.status = 201
  this.response.body = {
    user
  }
})

router.post('/login', function *(next) {
  let { email, password } = this.request.body

  // TODO: validate

  let selectUser = `SELECT password, id, role FROM users WHERE email = '${email}';`
  let userData = yield this.pg.queryOne(selectUser)

  // TODO: handle no user

  let validPw = yield bcryptCompare(password, userData.password)

  if (validPw) {
    let user = { role: userData.role, id: userData.id }
    let token = yield createToken(user)
    let profiles = yield getProfiles.call(this, user.id)

    user.profiles = profiles.map(profile => profile.id)

    // TODO: store in db
    user.activeProfile = user.profiles[0]

    this.cookies.set(config.get('jwt.cookie'), token, {
      expires: new Date(new Date().setMonth(new Date().getMonth() + 1))
    })

    this.response.body = {
      user,
      profiles
    }
  } else {
    this.status = 401
  }
})

router.post('/logout', hasValidToken, function *(next) {
  this.cookies.set(config.get('jwt.cookie'), '', {
    overwrite: true,
    expires: new Date(0)
  })
})

router.get('/', hasValidToken, function *(next) {
  let { user } = this.state
  let profiles = yield getProfiles.call(this, user.id)

  user.profiles = profiles.map(profile => profile.id)

  // TODO: store in db
  user.activeProfile = user.profiles[0]

  this.body = {
    user,
    profiles
  }
})

export default router
