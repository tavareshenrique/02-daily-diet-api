import cookie from '@fastify/cookie'
import fastify from 'fastify'

// import { transactionsRoutes } from './routes/transactions'

export const app = fastify()

app.register(cookie)

app.get('/hello', async (request, reply) => {
  return 'Hello World!'
})

// app.register(transactionsRoutes, {
//   prefix: 'transactions',
// })
