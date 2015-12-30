import createRouter from 'koa-router'
import { hasValidToken } from '../middleware/auth'

const router = createRouter({ prefix: '/profiles' })
router.use(hasValidToken)

router.post('/', function *(next) {
  const { name } = this.request.body
  const id = this.state.user.id

  let profile
  try {
    profile = yield this.pg.queryOne(`INSERT INTO profiles (name, user_id) VALUES ('${name}', ${id}) RETURNING id;`)
  } catch (err) {
    if (err.code === '23505') {
      this.throw(400, {type: 'DUPLICATE_NAME'})
    } else if (err.code === '23503') {
      this.throw(400, {type: 'INVALID_USER'})
    }
  }

  this.status = 201
  this.response.body = {
    profile: {
      id: profile.id
    }
  }
})

export default router
