import app from '../../index.js'
import assert from 'assert'
import config from 'config'
import pg from 'pg'
import supertest from 'supertest'

let request = supertest.agent(app.listen())

function tearDown (done) {
  pg.connect(config.get('pg.conStr'), (err, client, close) => {
    client.query('DELETE FROM posts; DELETE FROM profiles; DELETE FROM users;', (err, result) => {
      close()
      done()
    })
  })
}

function setUp (cb) {
  var profile

  request
    .post('/users')
    .send({'email' : 'new email', 'password' : 'new password'})
    .expect(201, (err, res) => {
      request
        .post('/profiles')
        .send({'name' : 'new name'})
        .expect(201, (err, res) => {
          profile = res.body.id
          cb(err, profile)
        })
    })
}

describe('post routes', () => {
  var profileId

  after(tearDown)

  before(done => {
    setUp((err, profile) => {
      profileId = profile
      done()
    })
  })

  describe('post', () => {
    var postId

    it('returns 201 and id when created', done => {
      request
        .post('/posts')
        .send({'content': {"pizza": true}, profileId})
        .expect(201, (err, res) => {
          assert.ok(res.body.id)
          postId = res.body.id
          done()
        })
    })

    it('returns 200, content, and profile id when fetched', done => {
      request
        .get('/posts/' + postId)
        .expect(200, (err, res) => {
          assert.deepEqual(res.body.content, {"pizza": true})
          assert.equal(res.body.profileId, profileId)
          done()
        })
    })
  })
})