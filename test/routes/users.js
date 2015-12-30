/* global it, describe, after, before */

import app from '../../index.js'
import assert from 'assert'
import config from 'config'
import jwt from 'jsonwebtoken'
import pg from 'pg'
import supertest from 'supertest'

let request = supertest.agent(app.listen())

describe('user routes', () => {
  describe('signup, login, and logout flow', () => {
    function tearDown (done) {
      pg.connect(config.get('pg.conStr'), (err, client, close) => {
        if (err) {
          done(err)
        }
        client.query('DELETE FROM profiles; DELETE FROM users;', (err, result) => {
          close()
          done(err)
        })
      })
    }

    function login (data, cb) {
      request
        .post('/users')
        .send(data)
        .expect(201, (err, res) => {
          cb(err)
        })
    }

    after(tearDown)

    it('validates email on signup', done => {
      request
        .post('/users')
        .send({'email': 'bad email', 'password': 'new password'})
        .expect(400, (err, res) => {
          assert.ifError(err)
          assert.ok(res.error)
          assert.equal(res.error.text, 'INVALID_EMAIL')
          done()
        })
    })

    it('validates password on signup', done => {
      request
        .post('/users')
        .send({'email': 'new@gmail.com', 'password': '2short'})
        .expect(400, (err, res) => {
          assert.ifError(err)
          assert.ok(res.error)
          assert.equal(res.error.text, 'INVALID_PASSWORD')
          done()
        })
    })

    it('ensures unique email on signup', done => {
      const user = {'email': 'duplicate@gmail.com', 'password': 'new password'}
      login(user, () => {
        request
          .post('/users')
          .send(user)
          .expect(400, (err, res) => {
            assert.ifError(err)
            assert.ok(res.error)
            assert.equal(res.error.text, 'DUPLICATE_EMAIL')
            done()
          })
      })
    })

    it('returns id and role when created', done => {
      request
        .post('/users')
        .send({'email': 'new@gmail.com', 'password': 'new password'})
        .expect(201, (err, res) => {
          assert.ifError(err)
          assert.ok(res.body.user)
          assert.ok(res.body.user.id)
          assert.ok(res.body.user.role)
          done()
        })
    })

    it('sets a cookie when created', done => {
      request
        .post('/users')
        .send({'email': 'new+1@gmail.com', 'password': 'new password'})
        .expect(201, (err, res) => {
          assert.ifError(err)
          assert.ok(res.headers['set-cookie'])
          let cookie = res.headers['set-cookie'][0]
          let token = cookie.match('(^|;)\\s*' + config.get('jwt.cookie') + '\\s*=\\s*([^;]+)')[2]
          assert.ok(jwt.verify(token, config.get('jwt.secret')))
          done()
        })
    })

    it('validates email on login', done => {
      request
        .post('/users/login')
        .send({'email': 'bad email', 'password': 'new password'})
        .expect(400, (err, res) => {
          assert.ifError(err)
          assert.ok(res.error)
          assert.equal(res.error.text, 'INCORRECT_INFO')
          done()
        })
    })

    it('validates password on login', done => {
      request
        .post('/users/login')
        .send({'email': 'new@gmail.com', 'password': '2short'})
        .expect(400, (err, res) => {
          assert.ifError(err)
          assert.ok(res.error)
          assert.equal(res.error.text, 'INCORRECT_INFO')
          done()
        })
    })

    it('ensures existing user on login', done => {
      request
        .post('/users/login')
        .send({'email': 'doesnotexist@gmail.com', 'password': 'new password'})
        .expect(400, (err, res) => {
          assert.ifError(err)
          assert.ok(res.error)
          assert.equal(res.error.text, 'INCORRECT_INFO')
          done()
        })
    })

    it('ensures correct password on login', done => {
      request
        .post('/users/login')
        .send({'email': 'new@gmail.com', 'password': 'wrong password'})
        .expect(400, (err, res) => {
          assert.ifError(err)
          assert.ok(res.error)
          assert.equal(res.error.text, 'INCORRECT_INFO')
          done()
        })
    })

    it('returns id and role when logged in', done => {
      request
        .post('/users/login')
        .send({'email': 'new@gmail.com', 'password': 'new password'})
        .expect(200, (err, res) => {
          assert.ifError(err)
          assert.ok(res.body.user)
          assert.ok(res.body.user.id)
          assert.ok(res.body.user.role)
          done()
        })
    })

    it('sets a cookie when logged in', done => {
      request
        .post('/users/login')
        .send({'email': 'new@gmail.com', 'password': 'new password'})
        .expect(200, (err, res) => {
          assert.ifError(err)
          assert.ok(res.headers['set-cookie'])
          let cookie = res.headers['set-cookie'][0]
          let token = cookie.match('(^|;)\\s*' + config.get('jwt.cookie') + '\\s*=\\s*([^;]+)')[2]
          assert.ok(jwt.verify(token, config.get('jwt.secret')))
          done()
        })
    })

    it('can get the current user and returns id and role', done => {
      request
        .get('/users')
        .expect(200, (err, res) => {
          assert.ifError(err)
          assert.ok(res.body.user)
          assert.ok(res.body.user.id)
          assert.ok(res.body.user.role)
          done()
        })
    })

    it('expires the cookie when logged out', done => {
      request
        .post('/users/logout')
        .send({})
        .expect(200, (err, res) => {
          assert.ifError(err)
          assert.ok(res.headers['set-cookie'])
          let cookie = res.headers['set-cookie'][0]
          assert.equal(cookie, config.get('jwt.cookie') + '=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; httponly')
          done()
        })
    })

    it('cannot logout without token', done => {
      request
        .post('/users/logout')
        .send({})
        .expect(401, (err, res) => {
          assert.ifError(err)
          done()
        })
    })

    it('cannot get current user without token', done => {
      request
        .get('/users')
        .expect(401, (err, res) => {
          assert.ifError(err)
          done()
        })
    })
  })

  describe('including user profiles data', () => {
    var profileId

    function tearDown (done) {
      pg.connect(config.get('pg.conStr'), (err, client, close) => {
        if (err) {
          done(err)
        }
        client.query('DELETE FROM profiles; DELETE FROM users;', (err, result) => {
          close()
          done(err)
        })
      })
    }

    function setUp (cb) {
      var profile

      request
        .post('/users')
        .send({'email': 'new@gmail.com', 'password': 'new password'})
        .expect(201, (err, res) => {
          if (err) {
            cb(err)
          }
          request
            .post('/profiles')
            .send({'name': 'new name'})
            .expect(201, (err, res) => {
              profileId = res.body.profile.id
              cb(err, profile)
            })
        })
    }

    before(setUp)
    after(tearDown)

    it('fetches profiles on login', done => {
      request
        .post('/users/login')
        .send({'email': 'new@gmail.com', 'password': 'new password'})
        .expect(200, (err, res) => {
          assert.ifError(err)
          assert.ok(res.body.profiles)
          assert.equal(res.body.profiles[0].id, profileId)

          assert.equal(res.body.user.activeProfile, profileId)
          assert.ok(res.body.user.profiles)
          assert.equal(res.body.user.profiles[0], profileId)
          done()
        })
    })

    it('fetches profiles on get', done => {
      request
        .get('/users')
        .expect(200, (err, res) => {
          assert.ifError(err)
          assert.ok(res.body.profiles)
          assert.equal(res.body.profiles[0].id, profileId)

          assert.equal(res.body.user.activeProfile, profileId)
          assert.ok(res.body.user.profiles)
          assert.equal(res.body.user.profiles[0], profileId)
          done()
        })
    })
  })
})
