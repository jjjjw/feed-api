import { generateTweet, postTweet } from '../jobs'

generateTweet().then(tweet => {
  console.log(`Posting tweet: ${tweet}`)
  return postTweet(tweet)
}).then(() => {
  process.exit(0)
}).catch(error => {
  console.log(`Error: ${error.message}`)
  process.exit(0)
})
