import app from '../../index.js'
import assert from 'assert'
import config from 'config'
import pg from 'pg'
import supertest from 'supertest'

let request = supertest.agent(app.listen())

function deleteUsers (done) {
  pg.connect(config.get('pg.conStr'), (err, client, close) => {
    client.query('DELETE FROM profiles; DELETE FROM users;', (err, result) => {
      close()
      done()
    })
  })
}

describe('user routes', () => {

  describe('user', () => {
    var token

    after(deleteUsers)

    it('returns 201 and token when created', done => {
      request
        .post('/users')
        .send({'email' : 'new email', 'password' : 'new password'})
        .expect(201, (err, res) => {
          assert.ok(res.body.token)
          done()
        })
    })

    it('returns 200 and token when logged in', done => {
      request
        .post('/users/login')
        .send({'email' : 'new email', 'password' : 'new password'})
        .expect(200, (err, res) => {
          assert.ok(res.body.token)
          token = res.body.token
          done()
        })
    })

    describe('profiles', () => {
      it('returns 200 and profiles when fetched', done => {
        request
          .get('/users/profiles')
          .set('Authorization', 'Bearer ' + token)
          .expect(200, (err, res) => {
            assert.ok(res.body.profiles)
            done()
          })
      })
    })
  })
})
