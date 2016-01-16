/* global it, describe, after, before */

import app from '../../index.js'
import assert from 'assert'
import config from 'config'
import pg from 'pg'
import supertest from 'supertest'
import fs from 'fs'
import path from 'path'

const request = supertest.agent(app.listen())

const materialTable = fs.readFileSync(path.join(__dirname, '../../sql/tables/material.sql'), 'utf8')

function tearDown (done) {
  pg.connect(config.get('pg.conStr'), (err, client, close) => {
    if (err) {
      done(err)
    }
    client.nonQuery('DROP TABLE material;', (err, result) => {
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
    client.nonQuery(materialTable, (err, result) => {
      close()
      done(err)
    })
  })
}

describe('material', () => {
  after(tearDown)

  before(setUp)

  it('returns id when created', done => {
    request
      .post('/material')
      .send({'content': 'The sky was the color of television tuned to a dead channel'})
      .expect(201, (err, res) => {
        assert.ifError(err)
        assert.ok(res.body.material)
        assert.ok(res.body.material.id)
        done()
      })
  })
})
