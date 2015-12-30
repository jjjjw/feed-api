/* global it, describe, after, before */

import app from '../../index.js'
import assert from 'assert'
import config from 'config'
import jwt from 'jsonwebtoken'
import pg from 'pg'
import supertest from 'supertest'

let request = supertest.agent(app.listen())
let unauthenticatedRequest = supertest.agent(app.listen())

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
  request
    .post('/users')
    .send({'email': 'new@gmail.com', 'password': 'new password'})
    .expect(201, (err, res) => {
      cb(err)
    })
}

describe('profile routes', () => {
  after(tearDown)

  before(done => {
    setUp(err => {
      done(err)
    })
  })

  describe('profile', () => {
    it('returns id when created', done => {
      request
        .post('/profiles')
        .send({'name': 'new name'})
        .expect(201, (err, res) => {
          assert.ifError(err)
          assert.ok(res.body.profile)
          assert.ok(res.body.profile.id)
          done()
        })
    })

    it('ensures unique name when created', done => {
      request
        .post('/profiles')
        .send({'name': 'new name'})
        .expect(400, (err, res) => {
          assert.ifError(err)
          assert.ok(res.error)
          assert.equal(res.error.text, 'DUPLICATE_NAME')
          done()
        })
    })

    it('ensures logged in', done => {
      unauthenticatedRequest
        .post('/profiles')
        .send({'name': 'new name'})
        .expect(401, (err, res) => {
          assert.ifError(err)
          done()
        })
    })

    it('ensures existing user', done => {
      let badJwt = jwt.sign({ id: 0 }, config.get('jwt.secret'), null)
      unauthenticatedRequest
        .post('/profiles')
        .send({'name': 'new new name'})
        .set('Authorization', `Bearer ${badJwt}`)
        .expect(400, (err, res) => {
          assert.ifError(err)
          assert.ok(res.error)
          assert.equal(res.error.text, 'INVALID_USER')
          done()
        })
    })
  })
})
