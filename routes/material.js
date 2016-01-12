import createRouter from 'koa-router'

const router = createRouter({ prefix: '/material' })

function generateSlug (name) {
  return slugify(name)
}

router.post('/', function *(next) {
  const { content } = this.request.body

  const insertMaterial = `INSERT INTO material (content) VALUES ('${content}') RETURNING id;`
  const material = yield this.pg.queryOne(insertMaterial)

  this.status = 201
  this.response.body = {
    material: {
      id: material.id
    }
  }
})

export default router
