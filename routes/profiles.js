import createRouter from 'koa-router'
import { hasValidToken } from '../middleware/auth'

const router = createRouter({ prefix: '/profiles' })
router.use(hasValidToken)

router.post('/', function *(next) {
  let { name } = this.request.body
  let id = this.state.user.id

  // TODO: validate

  let profile = yield this.pg.queryOne(`INSERT INTO profiles (name, user_id) VALUES ('${name}', ${id}) RETURNING id;`)

  this.status = 201
  this.response.body = { id: profile.id }
})

export default router