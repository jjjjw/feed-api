import app from '../../index.js'
import assert from 'assert'
import config from 'config'
import pg from 'pg'
import supertest from 'supertest'

let request = supertest.agent(app.listen())

function tearDown (done) {
  pg.connect(config.get('pg.conStr'), (err, client, close) => {
    client.query('DELETE FROM profiles; DELETE FROM users;', (err, result) => {
      close()
      done()
    })
  })
}
function logIn (cb) {
  request
    .post('/users/login')
    .send({'email' : 'new email', 'password' : 'new password'})
    .expect(200, (err, res) => {
      cb(err)
    })
}

describe('user routes', () => {

  describe('user', () => {

    after(tearDown)

    it('returns 201, id and role, when created', done => {
      request
        .post('/users')
        .send({'email' : 'new email', 'password' : 'new password'})
        .expect(201, (err, res) => {
          assert.ok(res.body.user)
          assert.ok(res.body.user.id)
          assert.ok(res.body.user.role)
          done()
        })
    })

    it('returns 200, id and role when logged in', done => {
      request
        .post('/users/login')
        .send({'email' : 'new email', 'password' : 'new password'})
        .expect(200, (err, res) => {
          assert.ok(res.body.user)
          assert.ok(res.body.user.id)
          assert.ok(res.body.user.role)
          done()
        })
    })

    it('returns 200, id and role for current user', done => {
      request
        .get('/users')
        .expect(200, (err, res) => {
          assert.ok(res.body.user)
          assert.ok(res.body.user.id)
          assert.ok(res.body.user.role)
          done()
        })
    })

    it('returns 200 when logged out', done => {
      request
        .post('/users/logout')
        .send({})
        .expect(200, (err, res) => {
          done()
        })
    })
  })
})
