/* global it, describe, after, before */

import app from '../../index.js'
import assert from 'assert'
import config from 'config'
import pg from 'pg'
import supertest from 'supertest'
import fs from 'fs'
import path from 'path'

const request = supertest.agent(app.listen())

const postsTable = fs.readFileSync(path.join(__dirname, '../../sql/tables/posts.sql'), 'utf8')

const postFixture = 'INSERT INTO posts (content, slug) VALUES (\'The sky was the color of television tuned to a dead channel.\', \'b53459b4-691c-42ec-a275-b59779dc0cc0\');'

function tearDown (done) {
  pg.connect(config.get('pg.conStr'), (err, client, close) => {
    if (err) {
      done(err)
    }
    client.query('DROP TABLE posts;', (err, result) => {
      close()
      done(err)
    })
  })
}

function setUp (done) {
  pg.connect(config.get('pg.conStr'), (err, client, close) => {
    if (err) {
      done(err)
    }
    client.query(`${postsTable}${postFixture}`, (err, result) => {
      close()
      done(err)
    })
  })
}

describe('posts', () => {

  after(tearDown)

  before(setUp)

  describe('post', () => {

    it('can be fetched by slug', done => {
      request
        .get('/posts/b53459b4-691c-42ec-a275-b59779dc0cc0')
        .expect(200, (err, res) => {
          assert.ifError(err)
          assert.ok(res.body.post)
          assert.ok(res.body.post.content)
          assert.equal(res.body.post.content, 'The sky was the color of television tuned to a dead channel.')
          done()
        })
    })
  })
})
