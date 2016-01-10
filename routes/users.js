import bcrypt from 'bcrypt'
import config from 'config'
import createRouter from 'koa-router'
import emailValidator from 'email-validator'
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

function validatePassword (pw) {
  return pw.length >= 8
}

function * getProfiles (pg, userId) {
  return (yield pg.query(`SELECT name, id, user_default FROM profiles WHERE user_id = ${userId};`)).rows
}

function adaptProfile (profile) {
  return {
    id: profile.id,
    name: profile.name,
    isDefault: profile.user_default
  }
}

function findDefaultProfile (profiles) {
  let initial
  if (profiles[0]) {
    initial = profiles[0].id
  }
  return profiles.reduce((defaultId, profile) => {
    if (profile.isDefault) {
      return profile.id
    } else {
      return defaultId
    }
  }, initial)
}

router.post('/', function *(next) {
  const { email, password } = this.request.body

  this.assert(emailValidator.validate(email), 400, {type: 'INVALID_EMAIL'})
  this.assert(validatePassword(password), 400, {type: 'INVALID_PASSWORD'})

  const hash = yield bcryptHash(password, 10)
  const insertUser = `INSERT INTO users (email, password) VALUES ('${email}', '${hash}') RETURNING id, role;`

  let user
  try {
    user = yield this.pg.queryOne(insertUser)
  } catch (err) {
    if (err.code === '23505') {
      this.throw(400, {type: 'DUPLICATE_EMAIL'})
    }
  }

  const token = yield createToken(user)

  this.cookies.set(config.get('jwt.cookie'), token, {
    expires: new Date(new Date().setMonth(new Date().getMonth() + 1))
  })

  this.status = 201
  this.response.body = {
    user
  }
})

router.post('/login', function *(next) {
  const { email, password } = this.request.body

  this.assert(emailValidator.validate(email), 400, {type: 'INCORRECT_INFO'})
  this.assert(validatePassword(password), 400, {type: 'INCORRECT_INFO'})

  const selectUser = `SELECT password, id, role FROM users WHERE email = '${email}';`
  let userData = (yield this.pg.query(selectUser)).rows
  if (!userData.length) {
    this.throw(400, {type: 'INCORRECT_INFO'})
  }
  userData = userData[0]

  const validPw = yield bcryptCompare(password, userData.password)
  this.assert(validPw, 400, {type: 'INCORRECT_INFO'})

  const user = { role: userData.role, id: userData.id }
  const token = yield createToken(user)
  const profiles = (yield getProfiles(this.pg, user.id)).map(adaptProfile)

  user.profiles = profiles.map(profile => profile.id)
  user.activeProfile = findDefaultProfile(profiles)

  this.cookies.set(config.get('jwt.cookie'), token, {
    expires: new Date(new Date().setMonth(new Date().getMonth() + 1))
  })

  this.response.body = {
    user,
    profiles
  }
})

router.post('/logout', hasValidToken, function *(next) {
  this.cookies.set(config.get('jwt.cookie'), '', {
    overwrite: true,
    expires: new Date(0)
  })
  this.status = 200
})

router.get('/', hasValidToken, function *(next) {
  const { user } = this.state
  const profiles = (yield getProfiles(this.pg, user.id)).map(adaptProfile)

  user.profiles = profiles.map(profile => profile.id)
  user.activeProfile = findDefaultProfile(profiles)

  this.body = {
    user,
    profiles
  }
})

export default router
