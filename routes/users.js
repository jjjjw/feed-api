import createRouter from 'koa-router'

let router = createRouter({ prefix: '/users' })

router.post('/', function *(next) {
  let { email, password } = this.request.body
  let user = yield this.pg.query('INSERT INTO users VALUES ($email, $password);', {
    email,
    password
  })
  this.status = 201
})

export default router
