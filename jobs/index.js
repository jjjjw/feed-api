import config from 'config'
import MarkovChain from 'markovchain'
import pg from 'postgres-gen'
import Twitter from 'twitter'

const client = new Twitter({
  consumer_key: config.get('twitter.consumer_key'),
  consumer_secret: config.get('twitter.consumer_secret'),
  access_token_key: config.get('twitter.access_token_key'),
  access_token_secret: config.get('twitter.access_token_secret')
})

const pgCon = pg(config.get('pg.conStr'))

export function generateTweet () {
  return pgCon.query('SELECT content FROM material ORDER BY random() limit 5;').then(res => {
    const text = res.rows.map(row => { return row.content }).join(' ')
    const chain = new MarkovChain(text)

    return chain.start(wordList => {
      return Object.keys(wordList)[0]
    }).end(140).process()
  })
}

export function postTweet (status) {
  return new Promise((resolve, reject) => {
    client.post('statuses/update', { status }, error => {
      if (error) {
        reject(error[0])
      }
    })
  })
}
