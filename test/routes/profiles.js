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

function setUp (cb) {
  var token

  request
    .post('/users')
    .send({'email' : 'new email', 'password' : 'new password'})
    .expect(201, (err, res) => {
      token = res.body.token
        cb(err, token)
    })
}

describe('profile routes', () => {

  var token
  var profileId

  after(tearDown)

  before(done => {
    setUp((err, userToken, userProfileId) => {
      token = userToken
      done()
    })
  })

  describe('profile', () => {
    it('returns 201 and id when created', done => {
      request
        .post('/profiles')
        .send({'name' : 'new name'})
        .set('Authorization', 'Bearer ' + token)
        .expect(201, (err, res) => {
          assert.ok(res.body.id)
          done()
        })
    })
  })
})
