import { randomUUID } from 'node:crypto'

import { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { knex } from '../database'

export async function usersRoutes(app: FastifyInstance) {
  app.post('/register', async (request, reply) => {
    const createUserBodySchema = z.object({
      name: z
        .string({
          message: 'Name must be at least 2 characters long',
        })
        .min(2, {
          message: 'Name must be at least 2 characters long',
        }),

      email: z
        .string({
          message: 'Invalid email address',
        })
        .email(),
      password: z
        .string({
          message: 'Password must be at least 8 characters long',
        })
        .min(8, {
          message: 'Password must be at least 8 characters long',
        }),
    })

    try {
      const { name, email, password } = createUserBodySchema.parse(request.body)

      const userAlreadyExists = await knex('users').where({ email }).first()

      if (userAlreadyExists) {
        return reply.status(409).send({
          error: {
            email: 'Email already in use',
          },
        })
      }

      await knex('users').insert({
        id: randomUUID(),
        name,
        email,
        password,
      })

      return reply.status(201).send()
    } catch (error) {
      return reply.status(400).send({
        error: (error as z.ZodError).errors.map((error: z.ZodIssue) => {
          return {
            [error.path[0]]: error.message,
          }
        }),
      })
    }
  })

  // app.post('/login', async (request, reply) => {
  //   const createUserBodySchema = z.object({
  //     name: z.string(),
  //     email: z.string().email(),
  //   })

  //   const { name, email } = createUserBodySchema.parse(request.body)

  //   await knex('users').insert({
  //     id: randomUUID(),
  //     name,
  //     email,
  //   })

  //   return reply.status(201).send()
  // })
}
