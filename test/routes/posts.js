/* global it, describe, after, before */

import app from '../../index.js'
import assert from 'assert'
import config from 'config'
import pg from 'pg'
import supertest from 'supertest'

let request = supertest.agent(app.listen())

function tearDown (done) {
  pg.connect(config.get('pg.conStr'), (err, client, close) => {
    if (err) {
      done(err)
    }
    client.query('DELETE FROM posts; DELETE FROM profiles; DELETE FROM users;', (err, result) => {
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
          profile = res.body.profile.id
          cb(err, profile)
        })
    })
}

describe('post routes', () => {
  var profileId

  after(tearDown)

  before(done => {
    setUp((err, profile) => {
      if (err) {
        done(err)
      }
      profileId = profile
      done()
    })
  })

  describe('post', () => {
    var postId

    it('returns 201 and id when created', done => {
      request
        .post('/posts')
        .send({'content': {'pizza': true}, profileId})
        .expect(201, (err, res) => {
          assert.ifError(err)
          assert.ok(res.body.post)
          assert.ok(res.body.post.id)
          postId = res.body.post.id
          done()
        })
    })

    it('returns 200, content, and profile id when fetched', done => {
      request
        .get('/posts/' + postId)
        .expect(200, (err, res) => {
          assert.ifError(err)
          assert.ok(res.body.post)
          assert.deepEqual(res.body.post.content, {'pizza': true})
          assert.equal(res.body.post.profileId, profileId)
          done()
        })
    })
  })
})
