import createRouter from 'koa-router'

const router = createRouter({ prefix: '/posts' })

router.get('/:slug', function *(next) {
  const slug = this.params.slug
  const post = yield this.pg.queryOne(`SELECT content FROM posts WHERE slug = '${slug}';`)

  this.response.body = {
    post: {
      content: post.content
    }
  }
})

export default router
