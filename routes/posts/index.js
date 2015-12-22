import config from 'config'
import createRouter from 'koa-router'
import crypto from 'crypto'
import jwt from 'koa-jwt'

const router = createRouter({ prefix: '/posts' })

router.post('/', jwt({ secret: config.get('jwt.secret') }), function *(next) {
  let { content, profileId } = this.request.body
  let contentJson = JSON.stringify(content)

  // TODO: validate

  let post = yield this.pg.queryOne(`INSERT INTO posts (content, profile_id) VALUES ('${contentJson}', ${profileId}) RETURNING id;`)

  this.status = 201
  this.response.body = { id: post.id }
})

router.get('/:id', function *(next) {
  let id = this.params.id

  let post = yield this.pg.queryOne(`SELECT content, profile_id FROM posts WHERE id = ${id};`)

  // TODO: handle not found

  this.response.body = {
    content: post.content,
    profileId: post.profile_id
  }
})

export default router
