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
  request
    .post('/users')
    .send({'email' : 'new email', 'password' : 'new password'})
    .expect(201, (err, res) => {
      cb(err)
    })
}

describe('profile routes', () => {
  var profileId

  after(tearDown)

  before(done => {
    setUp((err) => {
      done()
    })
  })

  describe('profile', () => {
    it('returns 201 and id when created', done => {
      request
        .post('/profiles')
        .send({'name' : 'new name'})
        .expect(201, (err, res) => {
          assert.ok(res.body.id)
          done()
        })
    })
  })
})
