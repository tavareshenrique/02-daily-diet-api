/* eslint-disable camelcase */
import { randomUUID } from 'node:crypto'

import { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { knex } from '../database'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

export async function mealsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', checkSessionIdExists)

  app.get('/', async (request, reply) => {
    const { sessionId } = request.cookies

    const meals = await knex('meals')
      .select(['id', 'name', 'description', 'date_time', 'is_diet'])
      .where({ session_id: sessionId })

    const mealsParseSchema = z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        date_time: z.string(),
        is_diet: z.number().transform((value) => {
          return value === 1
        }),
      }),
    )

    const mealsParsed = mealsParseSchema.parse(meals)

    return reply.status(200).send(mealsParsed)
  })

  app.get('/:id', async (request, reply) => {
    const getMealsParamsSchema = z.object({
      id: z.string().uuid(),
    })

    try {
      const { id } = getMealsParamsSchema.parse(request.params)

      const { sessionId } = request.cookies

      const meal = await knex('meals')
        .select(['id', 'name', 'description', 'date_time', 'is_diet'])
        .where({ session_id: sessionId, id })

      if (meal.length === 0) {
        return reply.status(404).send()
      }

      const mealParseSchema = z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        date_time: z.string(),
        is_diet: z.number().transform((value) => {
          return value === 1
        }),
      })

      const mealParsed = mealParseSchema.parse(meal[0])

      return reply.status(200).send(mealParsed)
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

  app.get('/summary', async (request, reply) => {
    const { sessionId } = request.cookies

    let totalMeals: string | number = 0

    const totalMealsResponse = await knex
      .count('id')
      .from('meals')
      .where({
        session_id: sessionId,
      })
      .first()

    if (totalMealsResponse) {
      totalMeals = totalMealsResponse['count(`id`)']
    }

    const totalMealsInDietResponse = await knex
      .count('id')
      .from('meals')
      .where({
        session_id: sessionId,
        is_diet: true,
      })
      .first()

    let totalMealsInDiet: string | number = 0

    if (totalMealsInDietResponse) {
      totalMealsInDiet = totalMealsInDietResponse['count(`id`)']
    }

    const totalMealsOutDietResponse = await knex
      .count('id')
      .from('meals')
      .where({
        session_id: sessionId,
        is_diet: false,
      })
      .first()

    let totalMealsOutDiet: string | number = 0

    if (totalMealsOutDietResponse) {
      totalMealsOutDiet = totalMealsOutDietResponse['count(`id`)']
    }

    const totalBestSequenceMealsInDietResponse = await knex
      .select('id', 'name', 'date_time', 'is_diet')
      .from('meals')
      .where({
        session_id: sessionId,
      })
      .orderBy('date_time', 'desc')

    const { bestOnDietSequence } = totalBestSequenceMealsInDietResponse.reduce(
      (acc, meal) => {
        if (meal.is_diet) {
          acc.currentSequence += 1
        } else {
          acc.currentSequence = 0
        }

        if (acc.currentSequence > acc.bestOnDietSequence) {
          acc.bestOnDietSequence = acc.currentSequence
        }

        return acc
      },
      { bestOnDietSequence: 0, currentSequence: 0 },
    )

    console.log('bestOnDietSequence ===>', bestOnDietSequence)

    return reply.status(200).send({
      totalMeals,
      totalMealsInDiet,
      totalMealsOutDiet,
      bestOnDietSequence,
    })
  })

  app.post('/register', async (request, reply) => {
    const createMealsBodySchema = z.object({
      name: z
        .string({
          message: 'Name must be at least 2 characters long',
        })
        .min(2, {
          message: 'Name must be at least 2 characters long',
        }),
      description: z.string({
        message: 'Description must be at least 2 characters long',
      }),
      date_time: z.coerce.string().datetime({
        offset: true,
        message: 'Invalid date_time',
      }),
      is_diet: z.boolean({
        message: 'Invalid is_diet',
      }),
    })

    try {
      const { name, description, date_time, is_diet } =
        createMealsBodySchema.parse(request.body)

      const { sessionId } = request.cookies

      const meal = await knex('meals')
        .insert({
          id: randomUUID(),
          name,
          description,
          date_time,
          is_diet,
          session_id: sessionId,
        })
        .returning(['id', 'name', 'description', 'date_time', 'is_diet'])

      const mealParseSchema = z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        date_time: z.string(),
        is_diet: z.number().transform((value) => {
          return value === 1
        }),
      })

      const mealParsed = mealParseSchema.parse(meal[0])

      return reply.status(201).send(mealParsed)
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

  app.put('/:id', async (request, reply) => {
    const createMealsBodySchema = z.object({
      name: z
        .string({
          message: 'Name must be at least 2 characters long',
        })
        .min(2, {
          message: 'Name must be at least 2 characters long',
        }),
      description: z.string({
        message: 'Description must be at least 2 characters long',
      }),
      date_time: z.coerce.string().datetime({
        offset: true,
        message: 'Invalid date_time',
      }),
      is_diet: z.boolean({
        message: 'Invalid is_diet',
      }),
    })

    const getMealsParamsSchema = z.object({
      id: z.string().uuid(),
    })

    try {
      const { id } = getMealsParamsSchema.parse(request.params)

      const { name, description, date_time, is_diet } =
        createMealsBodySchema.parse(request.body)

      const { sessionId } = request.cookies

      const meal = await knex('meals')
        .where({ session_id: sessionId, id })
        .update({
          name,
          description,
          date_time,
          is_diet,
        })
        .returning(['id', 'name', 'description', 'date_time', 'is_diet'])

      const mealParseSchema = z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        date_time: z.string(),
        is_diet: z.number().transform((value) => {
          return value === 1
        }),
      })

      const mealParsed = mealParseSchema.parse(meal[0])

      return reply.status(200).send(mealParsed)
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

  app.delete('/:id', async (request, reply) => {
    const getMealsParamsSchema = z.object({
      id: z.string().uuid(),
    })

    try {
      const { id } = getMealsParamsSchema.parse(request.params)

      const { sessionId } = request.cookies

      await knex('meals').where({ session_id: sessionId, id }).delete()

      return reply.status(204).send()
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
}
