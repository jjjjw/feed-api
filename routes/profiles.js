import createRouter from 'koa-router'
import slugify from 'slug'
import { hasValidToken } from '../middleware/auth'

const router = createRouter({ prefix: '/profiles' })
router.use(hasValidToken)

function generateSlug (name) {
  return slugify(name)
}

router.post('/', function *(next) {
  const { name, setDefault } = this.request.body
  const userId = this.state.user.id

  const userDefault = !!setDefault
  const slug = generateSlug(name)

  const insertProfile = `INSERT INTO profiles (name, slug, user_id, user_default) VALUES ('${name}', '${slug}', ${userId}, ${userDefault}) RETURNING id;`
  let profile
  try {
    profile = yield this.pg.queryOne(insertProfile)
  } catch (err) {
    if (err.code === '23505') {
      this.throw(400, {type: 'DUPLICATE_NAME'})
    } else if (err.code === '23503') {
      this.throw(400, {type: 'INVALID_USER'})
    } else if (err.code === '22001') {
      this.throw(400, {type: 'INVALID_NAME'})
    }
  }

  this.status = 201
  this.response.body = {
    profile: {
      id: profile.id,
      slug
    }
  }
})

export default router
