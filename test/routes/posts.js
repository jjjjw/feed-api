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
  var token
  var profile

  request
    .post('/users')
    .send({'email' : 'new email', 'password' : 'new password'})
    .expect(201, (err, res) => {
      token = res.body.token
      request
        .post('/profiles')
        .send({'name' : 'new name'})
        .set('Authorization', 'Bearer ' + token)
        .expect(201, (err, res) => {
          profile = res.body.id
          cb(err, token, profile)
        })
    })
}

describe('post routes', () => {
  var token
  var profileId

  after(tearDown)

  before(done => {
    setUp((err, userToken, userProfileId) => {
      token = userToken
      profileId = userProfileId
      done()
    })
  })

  describe('post', () => {
    var postId

    it('returns 201 and id when created', done => {
      request
        .post('/posts')
        .send({'content': {"pizza": true}, profileId})
        .set('Authorization', 'Bearer ' + token)
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
